package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/teampulse/backend/agents"
	"github.com/teampulse/backend/ai"
	"github.com/teampulse/backend/mockdata"
	"github.com/teampulse/backend/models"
)

// Handler holds dependencies for all HTTP handlers.
type Handler struct {
	aiClient *ai.Client
}

func New(client *ai.Client) *Handler {
	return &Handler{aiClient: client}
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

	brief, err := runSwarm(ctx, h.aiClient, trace)
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

	brief, err := runSwarm(ctx, h.aiClient, trace)
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

// ─── Shared swarm runner ──────────────────────────────────────────────────────
// This is the core of the concurrent engine.
// Three agents fire simultaneously via goroutines.
// A WaitGroup blocks until all three complete.
// The orchestrator then merges their outputs.

func runSwarm(ctx context.Context, g *ai.Client, trace chan<- models.TraceEvent) (models.MorningBrief, error) {
	trace <- models.TraceEvent{Type: "system", Message: "Initializing agent swarm..."}

	meetingAgent := agents.NewMeetingAgent(g)
	inboxAgent := agents.NewInboxAgent(g)
	ticketAgent := agents.NewTicketAgent(g)
	orchestrator := agents.NewOrchestrator(g)

	var (
		wg      sync.WaitGroup
		mu      sync.Mutex
		results []models.AgentResult
	)

	addResult := func(r models.AgentResult) {
		mu.Lock()
		results = append(results, r)
		mu.Unlock()
	}

	// ── Goroutine 1: Meeting Agent ──
	wg.Add(1)
	go func() {
		defer wg.Done()
		r := meetingAgent.Run(ctx, mockdata.Meetings, trace)
		addResult(r)
	}()

	// ── Goroutine 2: Inbox Agent ──
	wg.Add(1)
	go func() {
		defer wg.Done()
		r := inboxAgent.Run(ctx, mockdata.Emails, trace)
		addResult(r)
	}()

	// ── Goroutine 3: Ticket Agent ──
	wg.Add(1)
	go func() {
		defer wg.Done()
		r := ticketAgent.Run(ctx, mockdata.Tickets, trace)
		addResult(r)
	}()

	// Block until all three agents complete
	wg.Wait()

	if err := ctx.Err(); err != nil {
		return models.MorningBrief{}, err
	}

	trace <- models.TraceEvent{Type: "agent", Agent: "Orchestrator", Message: "All agents done — passing to Orchestrator..."}

	// Orchestrate
	brief, err := orchestrator.Merge(
		ctx, results,
		len(mockdata.Emails),
		len(mockdata.Meetings),
		len(mockdata.Tickets),
		trace,
	)
	if err != nil {
		return models.MorningBrief{}, fmt.Errorf("swarm: orchestration failed: %w", err)
	}

	return brief, nil
}
