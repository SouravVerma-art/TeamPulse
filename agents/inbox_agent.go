package agents

import (
	"context"
	"fmt"
	"time"

	"github.com/teampulse/backend/ai"
	"github.com/teampulse/backend/models"
)

// InboxAgent triages emails and surfaces actionable threads.
type InboxAgent struct {
	client *ai.Client
}

func NewInboxAgent(client *ai.Client) *InboxAgent {
	return &InboxAgent{client: client}
}

func (a *InboxAgent) Run(ctx context.Context, emails []models.EmailLog, trace chan<- models.TraceEvent) models.AgentResult {
	start := time.Now()
	name := "Inbox Agent"

	trace <- models.TraceEvent{Type: "agent", Agent: name, Message: fmt.Sprintf("Inbox Agent → triaging %d emails", len(emails))}

	// Only send high/medium priority unread emails to Gemini — saves tokens
	var relevant []models.EmailLog
	for _, e := range emails {
		if !e.IsRead && (e.Priority == "high" || e.Priority == "medium") {
			relevant = append(relevant, e)
		}
	}

	if len(relevant) == 0 {
		latency := fmt.Sprintf("%.1fs", time.Since(start).Seconds())
		trace <- models.TraceEvent{Type: "done", Agent: name, Message: fmt.Sprintf("Inbox Agent ✓ done (%s) — no urgent emails", latency)}
		return models.AgentResult{AgentName: name, Insights: nil, Latency: latency, ParsedN: len(emails)}
	}

	var emailBlock string
	for _, e := range relevant {
		emailBlock += fmt.Sprintf("From: %s\nSubject: %s\nBody: %s\n\n", e.From, e.Subject, e.Body)
	}

	prompt := fmt.Sprintf(`You are the Inbox Agent in a multi-agent AI system called TeamPulse.
Your job is to read the following unread high-priority emails and extract actionable insights.

For each email that requires action, extract:
- label: one of "Action", "Blocker", "Decision", "Update"
- text: one clear sentence describing what needs to happen (max 15 words)
- priority: one of "high", "medium", "low"

Return ONLY a valid JSON array. No markdown, no explanation.
Format: [{"label":"...","text":"...","priority":"..."}]

Emails:
%s`, emailBlock)

	var raw []struct {
		Label    string `json:"label"`
		Text     string `json:"text"`
		Priority string `json:"priority"`
	}

	if err := a.client.CompleteJSON(ctx, prompt, &raw); err != nil {
		trace <- models.TraceEvent{Type: "system", Agent: name, Message: fmt.Sprintf("Inbox Agent ✗ error: %v", err)}
		return models.AgentResult{AgentName: name, Error: err.Error()}
	}

	insights := make([]models.Insight, 0, len(raw))
	for _, r := range raw {
		insights = append(insights, models.Insight{
			Label:    models.InsightType(r.Label),
			Text:     r.Text,
			Priority: models.InsightPriority(r.Priority),
			Agent:    name,
		})
	}

	latency := fmt.Sprintf("%.1fs", time.Since(start).Seconds())
	trace <- models.TraceEvent{Type: "done", Agent: name, Message: fmt.Sprintf("Inbox Agent ✓ done (%s) — %d insights", latency, len(insights))}

	return models.AgentResult{
		AgentName: name,
		Insights:  insights,
		Latency:   latency,
		ParsedN:   len(emails),
	}
}
