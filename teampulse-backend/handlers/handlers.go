package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/teampulse/backend/agents"
	"github.com/teampulse/backend/ai"
	"github.com/teampulse/backend/mockdata"
	"github.com/teampulse/backend/models"
	"github.com/teampulse/backend/services"
)

// Handler holds dependencies for all HTTP handlers.
type Handler struct {
	aiClient     *ai.Client
	emailService *services.EmailService
	settings     *models.SystemSettings
	mu           sync.RWMutex
}

func New(client *ai.Client) *Handler {
	// Create a copy of default settings
	s := mockdata.DefaultSettings
	
	// Dynamically override Primary mailbox if GMAIL_USER is set
	email := os.Getenv("GMAIL_USER")
	if email != "" {
		fmt.Printf("[CONFIG] Autofilling Primary mailbox with: %s\n", email)
		if s.FieldValues != nil {
			s.FieldValues["Primary mailbox"] = email
		}
	} else {
		fmt.Println("[CONFIG] GMAIL_USER not set, using default mailbox")
	}

	return &Handler{
		aiClient:     client,
		emailService: services.NewEmailService(),
		settings:     &s,
	}
}

// ─── GET /settings ────────────────────────────────────────────────────────────

func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(h.settings)
}

// ─── POST /settings ───────────────────────────────────────────────────────────

func (h *Handler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var newSettings models.SystemSettings
	if err := json.NewDecoder(r.Body).Decode(&newSettings); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	h.settings = &newSettings
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

// ─── POST /brief ──────────────────────────────────────────────────────────────
// Runs all three agents concurrently via goroutines, then orchestrates the
// final brief. Returns the complete MorningBrief as JSON.

func (h *Handler) Brief(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()

	// Drain trace events into /dev/null for the non-streaming endpoint
	trace := make(chan models.TraceEvent, 32)
	go func() {
		for range trace {
		}
	}()

	brief, err := runSwarm(ctx, h.aiClient, h.settings, trace)
	close(trace)

	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(brief)
}

// ─── GET /brief/stream ────────────────────────────────────────────────────────
// Server-Sent Events endpoint. Streams trace events in real time as agents
// run concurrently. Final event is type="complete" with the full brief JSON.

func (h *Handler) BriefStream(w http.ResponseWriter, r *http.Request) {
	// SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no") // disable nginx buffering

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	ctx := r.Context()
	trace := make(chan models.TraceEvent, 32)

	// Stream trace events to client as they arrive
	done := make(chan struct{})
	go func() {
		defer close(done)
		for event := range trace {
			data, err := json.Marshal(event)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}()

	brief, err := runSwarm(ctx, h.aiClient, h.settings, trace)
	close(trace)
	<-done // wait for all events to flush

	if err != nil {
		errEvent, _ := json.Marshal(models.TraceEvent{Type: "error", Message: err.Error()})
		fmt.Fprintf(w, "data: %s\n\n", errEvent)
		flusher.Flush()
		return
	}

	// Send the final complete event with the brief payload
	type completePayload struct {
		models.TraceEvent
		Brief models.MorningBrief `json:"brief"`
	}
	payload := completePayload{
		TraceEvent: models.TraceEvent{Type: "complete", Message: "Brief ready"},
		Brief:      brief,
	}
	data, _ := json.Marshal(payload)
	fmt.Fprintf(w, "data: %s\n\n", data)
	flusher.Flush()
}

// ─── GET /health ──────────────────────────────────────────────────────────────

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
	})
}

// ─── POST /email/send ─────────────────────────────────────────────────────────

func (h *Handler) SendEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.SendEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// Actual email delivery
	err := h.emailService.SendEmail(req.To, req.Subject, req.Body)
	if err != nil {
		fmt.Printf("[ERROR] Failed to send email: %v\n", err)
		http.Error(w, fmt.Sprintf("failed to send email: %v", err), http.StatusInternalServerError)
		return
	}

	fmt.Printf("[SUCCESS] Sent email to %s\n", req.To)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "sent", "message": "Email sent successfully"})
}

// ─── Shared swarm runner ──────────────────────────────────────────────────────
// This is the core of the concurrent engine.
// Three agents fire simultaneously via goroutines.
// A WaitGroup blocks until all three complete.
// The orchestrator then merges their outputs.

func runSwarm(ctx context.Context, g *ai.Client, settings *models.SystemSettings, trace chan<- models.TraceEvent) (models.MorningBrief, error) {
	trace <- models.TraceEvent{Type: "system", Message: "Initializing agent swarm..."}

	meetingAgent := agents.NewMeetingAgent(g)
	inboxAgent := agents.NewInboxAgent(g)
	ticketAgent := agents.NewTicketAgent(g)
	orchestrator := agents.NewOrchestrator(g)
	emailService := services.NewEmailService()

	var (
		wg      sync.WaitGroup
		mu      sync.Mutex
		results []models.AgentResult
		emails  []models.EmailLog
	)

	addResult := func(r models.AgentResult) {
		mu.Lock()
		results = append(results, r)
		mu.Unlock()
	}

	// ── Fetch Real Emails ──
	trace <- models.TraceEvent{Type: "system", Message: "Fetching live emails from Gmail..."}
	liveEmails, err := emailService.FetchRecentEmails(10)
	if err != nil {
		trace <- models.TraceEvent{Type: "system", Message: fmt.Sprintf("Email fetch failed: %v. Falling back to demo data.", err)}
		emails = mockdata.Emails
	} else {
		emails = liveEmails
		trace <- models.TraceEvent{Type: "system", Message: fmt.Sprintf("Successfully fetched %d live emails.", len(emails))}
	}

	// ── Goroutine 1: Meeting Agent ──
	wg.Add(1)
	go func() {
		defer wg.Done()
		// Using demo meeting data for the hackathon showcase
		r := meetingAgent.Run(ctx, mockdata.Meetings, trace)
		addResult(r)
	}()

	// ── Goroutine 2: Inbox Agent ──
	wg.Add(1)
	go func() {
		defer wg.Done()
		r := inboxAgent.Run(ctx, emails, trace)
		addResult(r)
	}()

	// ── Goroutine 3: Ticket Agent ──
	wg.Add(1)
	go func() {
		defer wg.Done()
		// Using demo ticket data for the hackathon showcase
		r := ticketAgent.Run(ctx, mockdata.Tickets, trace)
		addResult(r)
	}()

	// Block until all three agents complete
	wg.Wait()

	if err := ctx.Err(); err != nil {
		return models.MorningBrief{}, err
	}

	trace <- models.TraceEvent{Type: "agent", Agent: "Orchestrator", Message: "All agents done - passing to Orchestrator..."}

	// Orchestrate
	brief, err := orchestrator.Merge(
		ctx, results,
		len(emails),
		len(mockdata.Meetings),
		len(mockdata.Tickets),
		trace,
	)
	if err != nil {
		return models.MorningBrief{}, fmt.Errorf("swarm: orchestration failed: %w", err)
	}

	// Personalize with Escalation owner from settings
	if settings != nil && settings.FieldValues != nil {
		if name, ok := settings.FieldValues["Escalation owner"]; ok && name != "" {
			brief.UserName = name
		}
	}

	return brief, nil
}
