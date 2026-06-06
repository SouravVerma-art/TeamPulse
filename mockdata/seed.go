package mockdata

import (

	"time"

	"github.com/teampulse/backend/models"
)

var now = time.Now()

// ─── Mock meeting transcripts (Product Manager Perspective) ──────────────────

var Meetings = []models.MeetingTranscript{
	{
		ID:         "mtg-roadmap-01",
		Title:      "Q4 Roadmap Strategy Review",
		OccurredAt: now.Add(-24 * time.Hour),
		Attendees:  []string{"Elliot (PM)", "Marcus (Eng Lead)", "Priya (Design)"},
		Transcript: `Elliot: Thanks for joining. We need to lock the Q4 roadmap. Marcus, what's the status of the 'Advanced Analytics' module?
Marcus: We're running into a bottleneck. The data warehouse API is slower than expected. We might need to push the release by two weeks.
Priya: If we push that, the dashboard redesign I'm working on won't have any data to show.
Elliot: That's a conflict. We can't ship a hollow dashboard. Let's prioritize the API optimization first.
Marcus: Agreed. I'll reassign the team to focus on the backend performance immediately.
Elliot: Okay. Action item: Marcus to provide a new technical ETA by Friday. Priya, hold on the high-fidelity mockups until the API contract is stable.`,
	},
	{
		ID:         "mtg-customer-02",
		Title:      "Enterprise Prospect: Acme Corp Sync",
		OccurredAt: now.Add(-48 * time.Hour),
		Attendees:  []string{"Elliot (PM)", "Jason (Sales)", "Customer Success"},
		Transcript: `Jason: Acme Corp is ready to sign, but they need 'Bulk Data Export' functionality. They say it's a dealbreaker.
Elliot: We don't have that on the roadmap until next year. How urgent is this?
Jason: They won't sign without it. They have a compliance audit in November.
Elliot: Understood. I'll need to check with Engineering if we can swap something out for this.
Jason: Please let me know soon. They're also looking at our competitor.`,
	},
	{
		ID:         "mtg-retro-03",
		Title:      "Sprint 22 Retrospective",
		OccurredAt: now.Add(-72 * time.Hour),
		Attendees:  []string{"Product Team", "Engineering", "QA"},
		Transcript: `Elliot: Good sprint, but QA was a bit of a scramble at the end.
QA Lead: We're getting builds too late in the cycle. The 'Payment Gateway' PR was merged on Thursday afternoon.
Marcus: Sorry about that, the SSO refactor took longer than expected.
Elliot: We need to improve the handoff. Let's try a 'Feature Freeze' 48 hours before the sprint ends next time.
QA Lead: That would definitely help.`,
	},
}

// ─── Mock email logs (Incoming to PM Elliot) ──────────────────────────────────

var Emails = []models.EmailLog{
	{
		ID:         "email-001",
		From:       "marcus.eng@teampulse.dev",
		Subject:    "BLOCKER: Data Warehouse API Limitations",
		Body:       "Hi Elliot, following up on our sync. The warehouse API simply can't handle the load for 'Bulk Export' without a complete cache redesign. This is a 3-week effort, not a quick fix. We need to decide if we're delaying the Q4 Analytics launch.",
		ReceivedAt: now.Add(-2 * time.Hour),
		IsRead:     false,
		Priority:   "high",
	},
	{
		ID:         "email-002",
		From:       "jason.sales@teampulse.dev",
		Subject:    "RE: Acme Corp - Urgent Update needed",
		Body:       "Hey Elliot, just checking in. Acme Corp's CTO just called. He wants to know if we can commit to the Bulk Export by November 15th. If we say yes, the contract is ours. Can we make it happen?",
		ReceivedAt: now.Add(-4 * time.Hour),
		IsRead:     false,
		Priority:   "high",
	},
	{
		ID:         "email-003",
		From:       "priya.design@teampulse.dev",
		Subject:    "Dashboard V2 - Design Handoff",
		Body:       "Hi Elliot, I've updated the Figma files based on the Roadmap Review. Since we're prioritizing API performance, I've added some 'loading state' explorations. Let me know if you have time for a 10m walkthrough.",
		ReceivedAt: now.Add(-6 * time.Hour),
		IsRead:     true,
		Priority:   "medium",
	},
	{
		ID:         "email-004",
		From:       "customer.support@teampulse.dev",
		Subject:    "Alert: Increase in 'Billing' tickets",
		Body:       "We've seen a 20% spike in tickets related to 'Invoices not generating'. Seems to have started after the Monday deploy. Marcus is aware but hasn't assigned anyone yet.",
		ReceivedAt: now.Add(-8 * time.Hour),
		IsRead:     false,
		Priority:   "high",
	},
	{
		ID:         "email-005",
		From:       "finance@teampulse.dev",
		Subject:    "Q4 Budget Guidelines - FINAL",
		Body:       "Elliot, please find the attached budget for the product org. We've had to trim the AWS spend by 5%. This will affect our ability to scale the ML training clusters. Please adjust the roadmap accordingly.",
		ReceivedAt: now.Add(-10 * time.Hour),
		IsRead:     true,
		Priority:   "medium",
	},
}

// ─── Mock Jira tickets (PM Scoping & Tracking) ────────────────────────────────

var Tickets = []models.JiraTicket{
	{
		ID:          "TP-401",
		Title:       "Investigate Warehouse API Performance",
		Status:      "in_progress",
		Assignee:    "Marcus (Eng Lead)",
		LastUpdated: now.Add(-3 * time.Hour),
		Description: "Identify bottlenecks in the analytics query engine. Blocking Q4 Roadmap items.",
		Labels:      []string{"backend", "blocker", "q4-roadmap"},
	},
	{
		ID:          "TP-402",
		Title:       "Bulk Data Export for Enterprise Compliance",
		Status:      "open",
		Assignee:    "Elliot (PM)",
		LastUpdated: now.Add(-2 * time.Hour),
		Description: "Scoped based on Acme Corp request. Requires architectural review for Compliance/Legal.",
		Labels:      []string{"feature", "sales-blocker", "high-priority"},
	},
	{
		ID:          "TP-403",
		Title:       "Fix: Invoices Not Generating correctly",
		Status:      "open",
		Assignee:    "Platform Team",
		LastUpdated: now.Add(-8 * time.Hour),
		Description: "Regression in the billing service. Affecting all tier-1 customers.",
		Labels:      []string{"bug", "urgent", "billing"},
	},
	{
		ID:          "TP-404",
		Title:       "Dashboard V2 Frontend Implementation",
		Status:      "blocked",
		Assignee:    "Frontend Team",
		LastUpdated: now.Add(-24 * time.Hour),
		Description: "Blocked by API contract finalization from Backend Team.",
		Labels:      []string{"ui", "blocked"},
	},
	{
		ID:          "TP-405",
		Title:       "Q4 Budget Realignment",
		Status:      "open",
		Assignee:    "Elliot (PM)",
		LastUpdated: now.Add(-12 * time.Hour),
		Description: "Reduce ML training cluster costs by 5% to meet new finance guidelines.",
		Labels:      []string{"ops", "finance"},
	},
}

var DefaultSettings = models.SystemSettings{
	AutoRun:            false,
	EmailNotifications: true,
	IntegrationStatus: map[string]bool{
		"Microsoft Teams": true,
		"Slack":           false,
		"Jira":            true,
		"GitHub":          true,
	},
	FieldValues: map[string]string{
		"Microsoft Teams workspace": "Product Launch",
		"Zoom cloud folder":         "Launch Readiness",
		"Primary mailbox":           "elliot@teampulse.dev",
		"Priority label":            "Needs reply",
		"Jira project":              "MOB",
		"GitHub repo":               "teampulse/app",
		"Risk threshold":            "Medium",
		"Escalation owner":          "Elliot",
	},
}
