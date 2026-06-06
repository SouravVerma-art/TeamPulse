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

	trace <- models.TraceEvent{Type: "agent", Agent: name, Message: fmt.Sprintf("Inbox Agent triaging %d emails", len(emails))}

	// Process all emails for now (including Read) so the user can see live data
	var relevant []models.EmailLog
	for _, e := range emails {
		trace <- models.TraceEvent{Type: "agent", Agent: name, Message: fmt.Sprintf("Reading: %s (from %s)", e.Subject, e.From)}
		relevant = append(relevant, e)
	}

	if len(relevant) == 0 {
		latency := fmt.Sprintf("%.1fs", time.Since(start).Seconds())
		trace <- models.TraceEvent{Type: "done", Agent: name, Message: fmt.Sprintf("Inbox Agent done (%s) - no urgent emails", latency)}
		return models.AgentResult{AgentName: name, Insights: nil, Latency: latency, ParsedN: len(emails)}
	}

	var emailBlock string
	for _, e := range relevant {
		emailBlock += fmt.Sprintf("ID: %s\nFrom: %s\nSubject: %s\nReceived: %s\nBody: %s\n\n", e.ID, e.From, e.Subject, e.ReceivedAt.Format(time.RFC3339), e.Body)
	}

	prompt := fmt.Sprintf(`You are the Inbox Agent in a multi-agent AI system called TeamPulse.
Your job is to read the following unread high-priority emails and extract actionable insights.

For each email that requires action, extract:
- label: one of "Action", "Blocker", "Decision", "Update"
- text: one clear sentence describing what needs to happen (max 15 words)
- priority: one of "high", "medium", "low"
- reasoning: a brief explanation (1 sentence) of why this insight was extracted and which sender it came from.
- created_at: the EXACT "Received" timestamp from the email metadata.
- source_id: the EXACT "ID" from the email metadata.

Return ONLY a valid JSON array. No markdown, no explanation.
Format: [{"label":"...","text":"...","priority":"...","reasoning":"...","created_at":"...","source_id":"..."}]

Emails:
%s`, emailBlock)

	var raw []struct {
		Label     string `json:"label"`
		Text      string `json:"text"`
		Priority  string `json:"priority"`
		Reasoning string `json:"reasoning"`
		CreatedAt string `json:"created_at"`
		SourceID  string `json:"source_id"`
	}

	if err := a.client.CompleteJSON(ctx, prompt, &raw); err != nil || len(raw) == 0 {
		trace <- models.TraceEvent{Type: "system", Agent: name, Message: fmt.Sprintf("Inbox Agent done - no insights extracted")}
		return models.AgentResult{AgentName: name, Insights: nil, Latency: fmt.Sprintf("%.1fs", time.Since(start).Seconds()), ParsedN: len(emails)}
	}

	// Create lookups for full content and sender
	contentMap := make(map[string]string)
	senderMap := make(map[string]string)
	for _, e := range relevant {
		contentMap[e.ID] = e.Body
		senderMap[e.ID] = e.From
	}

	insights := make([]models.Insight, 0, len(raw))
	for _, r := range raw {
		insights = append(insights, models.Insight{
			Label:         models.InsightType(r.Label),
			Text:          r.Text,
			Priority:      models.InsightPriority(r.Priority),
			Agent:         name,
			Reasoning:     r.Reasoning,
			CreatedAt:     r.CreatedAt,
			SourceContent: contentMap[r.SourceID],
			SourceSender:  senderMap[r.SourceID],
		})
	}

	latency := fmt.Sprintf("%.1fs", time.Since(start).Seconds())
	trace <- models.TraceEvent{Type: "done", Agent: name, Message: fmt.Sprintf("Inbox Agent done (%s) - %d insights", latency, len(insights))}

	return models.AgentResult{
		AgentName: name,
		Insights:  insights,
		Latency:   latency,
		ParsedN:   len(emails),
	}
}
