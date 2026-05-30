package agents

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/teampulse/backend/ai"
	"github.com/teampulse/backend/models"
)

// Orchestrator merges all agent results, deduplicates insights,
// detects cross-signal conflicts, and produces the final morning brief.
type Orchestrator struct {
	client *ai.Client
}

func NewOrchestrator(client *ai.Client) *Orchestrator {
	return &Orchestrator{client: client}
}

// Merge takes the results from all three agents and produces a final MorningBrief.
func (o *Orchestrator) Merge(
	ctx context.Context,
	results []models.AgentResult,
	emailCount, meetingCount, ticketCount int,
	trace chan<- models.TraceEvent,
) (models.MorningBrief, error) {

	start := time.Now()
	trace <- models.TraceEvent{Type: "agent", Agent: "Orchestrator", Message: "Orchestrator → merging insights from all agents..."}

	// Collect all raw insights
	var allInsights []models.Insight
	for _, r := range results {
		allInsights = append(allInsights, r.Insights...)
	}

	if len(allInsights) == 0 {
		trace <- models.TraceEvent{Type: "system", Agent: "Orchestrator", Message: "Orchestrator → No insights found to merge."}
		return models.MorningBrief{
			GeneratedAt:    time.Now(),
			UserName:       "Sarah",
			EmailCount:     emailCount,
			MeetingCount:   meetingCount,
			TicketCount:    ticketCount,
			Insights:       []models.Insight{},
			ConflictsFound: 0,
			AgentResults:   results,
		}, nil
	}

	// Build JSON representation of all insights for the prompt
	insightsJSON, err := json.Marshal(allInsights)
	if err != nil {
		return models.MorningBrief{}, fmt.Errorf("orchestrator: marshal failed: %w", err)
	}

	prompt := fmt.Sprintf(`You are the Orchestrator in a multi-agent AI system called TeamPulse.
You have received insights from three parallel agents: Meeting Agent, Inbox Agent, and Ticket Agent.

Your tasks:
1. Deduplicate insights that refer to the same underlying issue
2. Detect cross-signal CONFLICTS — where one agent's insight contradicts or creates tension with another
3. For conflicts, create a new insight with label "Conflict" and priority "high"
4. Sort the final list by priority: high → medium → low
5. Keep the final list to a maximum of 7 insights

Return ONLY a valid JSON array of the final merged insights.
Each object must have: label, text, priority, agent (use "Orchestrator" for conflicts you synthesised, otherwise keep the original agent name)
No markdown, no explanation.

Input insights:
%s`, string(insightsJSON))

	var merged []struct {
		Label    string `json:"label"`
		Text     string `json:"text"`
		Priority string `json:"priority"`
		Agent    string `json:"agent"`
	}

	if err := o.client.CompleteJSON(ctx, prompt, &merged); err != nil || len(merged) == 0 {
		// Fallback: use raw insights sorted by priority if Gemini fails or returns nothing
		trace <- models.TraceEvent{Type: "system", Agent: "Orchestrator", Message: "Orchestrator → Gemini merge failed or empty, using fallback sort"}
		merged = nil
		for _, ins := range allInsights {
			merged = append(merged, struct {
				Label    string `json:"label"`
				Text     string `json:"text"`
				Priority string `json:"priority"`
				Agent    string `json:"agent"`
			}{string(ins.Label), ins.Text, string(ins.Priority), ins.Agent})
		}
	}

	// Sort: high > medium > low
	order := map[string]int{"high": 0, "medium": 1, "low": 2}
	sort.Slice(merged, func(i, j int) bool {
		return order[merged[i].Priority] < order[merged[j].Priority]
	})

	// Cap at 7
	if len(merged) > 7 {
		merged = merged[:7]
	}

	// Count conflicts
	conflictCount := 0
	for _, m := range merged {
		if strings.EqualFold(m.Label, "Conflict") {
			conflictCount++
		}
	}

	if conflictCount > 0 {
		trace <- models.TraceEvent{
			Type:    "conflict",
			Agent:   "Orchestrator",
			Message: fmt.Sprintf("Conflict detected: %d cross-agent conflicts found", conflictCount),
		}
	}

	finalInsights := make([]models.Insight, 0, len(merged))
	for _, m := range merged {
		finalInsights = append(finalInsights, models.Insight{
			Label:    models.InsightType(m.Label),
			Text:     m.Text,
			Priority: models.InsightPriority(m.Priority),
			Agent:    m.Agent,
		})
	}

	latency := fmt.Sprintf("%.1fs", time.Since(start).Seconds())
	trace <- models.TraceEvent{Type: "done", Agent: "Orchestrator", Message: fmt.Sprintf("Orchestrator ✓ briefing ready (%s)", latency)}

	brief := models.MorningBrief{
		GeneratedAt:    time.Now(),
		UserName:       "Sarah",
		EmailCount:     emailCount,
		MeetingCount:   meetingCount,
		TicketCount:    ticketCount,
		Insights:       finalInsights,
		ConflictsFound: conflictCount,
		AgentResults:   results,
	}

	return brief, nil
}
