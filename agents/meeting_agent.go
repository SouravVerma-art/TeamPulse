package agents

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/teampulse/backend/ai"
	"github.com/teampulse/backend/models"
)

// MeetingAgent parses meeting transcripts and extracts structured insights.
type MeetingAgent struct {
	client *ai.Client
}

func NewMeetingAgent(client *ai.Client) *MeetingAgent {
	return &MeetingAgent{client: client}
}

func (a *MeetingAgent) Run(ctx context.Context, meetings []models.MeetingTranscript, trace chan<- models.TraceEvent) models.AgentResult {
	start := time.Now()
	name := "Meeting Agent"

	trace <- models.TraceEvent{Type: "agent", Agent: name, Message: fmt.Sprintf("Meeting Agent → parsing %d transcripts", len(meetings))}

	// Build the transcript block for the prompt
	var transcriptBlock string
	for _, m := range meetings {
		transcriptBlock += fmt.Sprintf("--- Meeting: %s (%s) ---\nAttendees: %v\n%s\n\n",
			m.Title, m.OccurredAt.Format("Mon Jan 2"), m.Attendees, m.Transcript)
	}

	prompt := fmt.Sprintf(`You are the Meeting Agent in a multi-agent AI system called TeamPulse.
Your job is to read the following meeting transcripts and extract structured insights.

For each insight, identify:
- label: one of "Decision", "Action", "Blocker", "Conflict", "Update"
- text: a single clear, actionable sentence (max 15 words)
- priority: one of "high", "medium", "low"

Return ONLY a valid JSON array of insight objects. No explanation, no markdown fences.
Format: [{"label":"...","text":"...","priority":"..."}]

Transcripts:
%s`, transcriptBlock)

	var raw []struct {
		Label    string `json:"label"`
		Text     string `json:"text"`
		Priority string `json:"priority"`
	}

	if err := a.client.CompleteJSON(ctx, prompt, &raw); err != nil {
		trace <- models.TraceEvent{Type: "system", Agent: name, Message: fmt.Sprintf("Meeting Agent ✗ error: %v", err)}
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
	trace <- models.TraceEvent{Type: "done", Agent: name, Message: fmt.Sprintf("Meeting Agent ✓ done (%s) — %d insights", latency, len(insights))}

	return models.AgentResult{
		AgentName: name,
		Insights:  insights,
		Latency:   latency,
		ParsedN:   len(meetings),
	}
}

// Ensure AgentResult can be JSON-encoded for debugging
var _ = json.Marshal
