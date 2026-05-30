package agents

import (
	"context"
	"fmt"
	"time"

	"github.com/teampulse/backend/ai"
	"github.com/teampulse/backend/models"
)

// TicketAgent scans Jira tickets for blockers, stale items, and deadline risks.
type TicketAgent struct {
	client *ai.Client
}

func NewTicketAgent(client *ai.Client) *TicketAgent {
	return &TicketAgent{client: client}
}

func (a *TicketAgent) Run(ctx context.Context, tickets []models.JiraTicket, trace chan<- models.TraceEvent) models.AgentResult {
	start := time.Now()
	name := "Ticket Agent"

	trace <- models.TraceEvent{Type: "agent", Agent: name, Message: fmt.Sprintf("Ticket Agent → scanning %d tickets", len(tickets))}

	var ticketBlock string
	for _, t := range tickets {
		daysSince := int(time.Since(t.LastUpdated).Hours() / 24)
		ticketBlock += fmt.Sprintf(
			"ID: %s | Title: %s | Status: %s | Assignee: %s | Last updated: %d days ago\nDescription: %s\n\n",
			t.ID, t.Title, t.Status, t.Assignee, daysSince, t.Description,
		)
	}

	prompt := fmt.Sprintf(`You are the Ticket Agent in a multi-agent AI system called TeamPulse.
Your job is to scan Jira tickets and surface blockers, stale items, and deadline risks.

Rules:
- Flag any ticket with status "blocked" as high priority
- Flag any ticket not updated in 3+ days as a potential blocker
- Flag deadline-sensitive tickets as high priority
- Summarise each issue in one clear sentence (max 15 words)

Return ONLY a valid JSON array. No markdown, no explanation.
Format: [{"label":"...","text":"...","priority":"..."}]

Where label is one of: "Blocker", "Action", "Update", "Decision"

Tickets:
%s`, ticketBlock)

	var raw []struct {
		Label    string `json:"label"`
		Text     string `json:"text"`
		Priority string `json:"priority"`
	}

	if err := a.client.CompleteJSON(ctx, prompt, &raw); err != nil {
		trace <- models.TraceEvent{Type: "system", Agent: name, Message: fmt.Sprintf("Ticket Agent ✗ error: %v", err)}
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
	trace <- models.TraceEvent{Type: "done", Agent: name, Message: fmt.Sprintf("Ticket Agent ✓ done (%s) — %d insights", latency, len(insights))}

	return models.AgentResult{
		AgentName: name,
		Insights:  insights,
		Latency:   latency,
		ParsedN:   len(tickets),
	}
}
