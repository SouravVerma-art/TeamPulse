package mockdata

import (
	"fmt"
	"time"

	"github.com/teampulse/backend/models"
)

var now = time.Now()

// ─── Mock meeting transcripts ─────────────────────────────────────────────────

var Meetings = []models.MeetingTranscript{
	{
		ID:         "mtg-001",
		Title:      "Q3 Sprint Planning",
		OccurredAt: now.Add(-72 * time.Hour),
		Attendees:  []string{"Sarah", "Marcus", "Priya", "Dev Team"},
		Transcript: `Marcus: Alright, let's lock in the sprint goals. We're pushing the onboarding redesign to week two.
Sarah: Agreed. Also — the deploy to staging was approved by leadership. We can move forward with that.
Priya: I'll coordinate with design. Can we get the mockups by Thursday?
Marcus: Should be fine. One concern — the new auth service conflicts with the Q3 roadmap item we discussed last month.
Sarah: That's a real problem. Let's flag that for the orchestrator to catch. We need resolution before EOD Friday.
Marcus: Noted. Action item: Sarah to follow up with design team on new onboarding mockups by Thursday.`,
	},
	{
		ID:         "mtg-002",
		Title:      "Infrastructure Cost Review",
		OccurredAt: now.Add(-48 * time.Hour),
		Attendees:  []string{"Sarah", "Ops Team", "Finance"},
		Transcript: `Ops Lead: Infrastructure costs are up 18% this quarter. Mostly compute for the new ML pipeline.
Sarah: We need a Jira ticket for this — track it against the cost reduction initiative.
Finance: Agreed. This has to be resolved before the board meeting.
Ops Lead: I'll create the ticket now and assign to the infra team.
Sarah: Good. Also flagging that PR #447 has been sitting for three days without a review.
Marcus [async]: I'll get to it today, sorry for the delay.`,
	},
	{
		ID:         "mtg-003",
		Title:      "Weekly Sync — Product & Engineering",
		OccurredAt: now.Add(-24 * time.Hour),
		Attendees:  []string{"Sarah", "Product", "Engineering Leads"},
		Transcript: `Product: The new onboarding flow is a priority for this sprint. Design is 80% done.
Sarah: Engineering is ready to pick it up as soon as mockups land.
Lead: One blocker — we're waiting on the API contract from the backend team.
Sarah: I'll chase that up today.
Product: Also — the sprint goal around user activation needs to be reconciled with the Q3 roadmap. There may be a conflict.`,
	},
}

// ─── Mock email logs ──────────────────────────────────────────────────────────

var Emails = []models.EmailLog{
	{
		ID:         "email-001",
		From:       "marcus@company.com",
		Subject:    "RE: PR #447 — Auth Service Refactor",
		Body:       "Hey Sarah, just flagging that PR #447 has been open for 3 days. I haven't had bandwidth to review. Can someone else pick it up or should I prioritise?",
		ReceivedAt: now.Add(-4 * time.Hour),
		IsRead:     false,
		Priority:   "high",
	},
	{
		ID:         "email-002",
		From:       "design@company.com",
		Subject:    "Onboarding Mockups — Ready for Review",
		Body:       "Hi team, the new onboarding mockups are ready. Please review and provide feedback by Thursday EOD so engineering can start next sprint.",
		ReceivedAt: now.Add(-6 * time.Hour),
		IsRead:     false,
		Priority:   "high",
	},
	{
		ID:         "email-003",
		From:       "ops@company.com",
		Subject:    "Jira Ticket Created — Infra Cost Spike",
		Body:       "Ticket INFRA-209 has been created to track the 18% infrastructure cost increase. Assigned to the infra team with a target resolution of end of quarter.",
		ReceivedAt: now.Add(-8 * time.Hour),
		IsRead:     true,
		Priority:   "medium",
	},
	{
		ID:         "email-004",
		From:       "finance@company.com",
		Subject:    "Board Meeting Prep — Cost Review Required",
		Body:       "Sarah, we need the infrastructure cost reduction plan included in the board deck. Deadline is Friday. Please coordinate with Ops.",
		ReceivedAt: now.Add(-10 * time.Hour),
		IsRead:     false,
		Priority:   "high",
	},
	{
		ID:         "email-005",
		From:       "product@company.com",
		Subject:    "Sprint Goal Conflict — Needs Discussion",
		Body:       "Hi Sarah, spotted a potential conflict between our sprint activation goal and the Q3 roadmap item (OKR-14). Think we need a quick call to align before planning locks in.",
		ReceivedAt: now.Add(-12 * time.Hour),
		IsRead:     false,
		Priority:   "high",
	},
}

// Pad to simulate 47 emails
func init() {
	for i := 6; i <= 47; i++ {
		Emails = append(Emails, models.EmailLog{
			ID:         "email-" + fmt.Sprintf("%03d", i),
			From:       "team@company.com",
			Subject:    "FYI — Weekly Update",
			Body:       "Routine update. No action required.",
			ReceivedAt: now.Add(-time.Duration(i) * time.Hour),
			IsRead:     true,
			Priority:   "low",
		})
	}
}

// ─── Mock Jira tickets ────────────────────────────────────────────────────────

var Tickets = []models.JiraTicket{
	{
		ID:          "PR-447",
		Title:       "Auth Service Refactor",
		Status:      "blocked",
		Assignee:    "Marcus",
		LastUpdated: now.Add(-72 * time.Hour),
		Description: "Refactor the auth service to support the new SSO provider. PR open and waiting for review.",
		Labels:      []string{"backend", "auth", "blocked"},
	},
	{
		ID:          "INFRA-209",
		Title:       "Infrastructure Cost Spike — 18% Increase",
		Status:      "open",
		Assignee:    "Ops Team",
		LastUpdated: now.Add(-8 * time.Hour),
		Description: "Compute costs up 18% QoQ due to ML pipeline expansion. Investigate and reduce.",
		Labels:      []string{"infra", "cost", "priority"},
	},
	{
		ID:          "OKR-14",
		Title:       "User Activation — Q3 Roadmap",
		Status:      "in_progress",
		Assignee:    "Product",
		LastUpdated: now.Add(-24 * time.Hour),
		Description: "Drive user activation rate from 42% to 60% by end of Q3.",
		Labels:      []string{"okr", "product", "q3"},
	},
	{
		ID:          "ENG-88",
		Title:       "Onboarding API Contract",
		Status:      "open",
		Assignee:    "Backend Team",
		LastUpdated: now.Add(-36 * time.Hour),
		Description: "Define and publish the API contract for the new onboarding flow.",
		Labels:      []string{"api", "onboarding", "blocker"},
	},
	{
		ID:          "ENG-91",
		Title:       "Board Meeting — Cost Reduction Plan",
		Status:      "open",
		Assignee:    "Sarah",
		LastUpdated: now.Add(-10 * time.Hour),
		Description: "Prepare infrastructure cost reduction plan for board meeting. Deadline: Friday.",
		Labels:      []string{"board", "finance", "deadline"},
	},
}
