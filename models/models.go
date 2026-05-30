package models

import "time"

// ─── Input data models ────────────────────────────────────────────────────────

type MeetingTranscript struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	OccurredAt time.Time `json:"occurred_at"`
	Attendees  []string  `json:"attendees"`
	Transcript string    `json:"transcript"`
}

type EmailLog struct {
	ID         string    `json:"id"`
	From       string    `json:"from"`
	Subject    string    `json:"subject"`
	Body       string    `json:"body"`
	ReceivedAt time.Time `json:"received_at"`
	IsRead     bool      `json:"is_read"`
	Priority   string    `json:"priority"` // "high" | "medium" | "low"
}

type JiraTicket struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Status      string    `json:"status"` // "open" | "in_progress" | "blocked" | "done"
	Assignee    string    `json:"assignee"`
	LastUpdated time.Time `json:"last_updated"`
	Description string    `json:"description"`
	Labels      []string  `json:"labels"`
}

// ─── Agent output models ──────────────────────────────────────────────────────

type InsightPriority string

const (
	PriorityHigh   InsightPriority = "high"
	PriorityMedium InsightPriority = "medium"
	PriorityLow    InsightPriority = "low"
)

type InsightType string

const (
	TypeDecision InsightType = "Decision"
	TypeBlocker  InsightType = "Blocker"
	TypeConflict InsightType = "Conflict"
	TypeAction   InsightType = "Action"
	TypeUpdate   InsightType = "Update"
)

type Insight struct {
	Label    InsightType     `json:"label"`
	Text     string          `json:"text"`
	Priority InsightPriority `json:"priority"`
	Agent    string          `json:"agent"`
}

type AgentResult struct {
	AgentName string    `json:"agent_name"`
	Insights  []Insight `json:"insights"`
	Latency   string    `json:"latency"`
	ParsedN   int       `json:"parsed_n"`
	Error     string    `json:"error,omitempty"`
}

// ─── Final briefing model ─────────────────────────────────────────────────────

type MorningBrief struct {
	GeneratedAt    time.Time     `json:"generated_at"`
	UserName       string        `json:"user_name"`
	EmailCount     int           `json:"email_count"`
	MeetingCount   int           `json:"meeting_count"`
	TicketCount    int           `json:"ticket_count"`
	Insights       []Insight     `json:"insights"`
	ConflictsFound int           `json:"conflicts_found"`
	AgentResults   []AgentResult `json:"agent_results"`
}

// ─── SSE event model ──────────────────────────────────────────────────────────

type TraceEvent struct {
	Type    string `json:"type"` // "system" | "agent" | "done" | "conflict" | "complete"
	Message string `json:"message"`
	Agent   string `json:"agent,omitempty"`
}
