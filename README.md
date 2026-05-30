# TeamPulse — Go Backend

Multi-agent AI backend that runs Meeting, Inbox, and Ticket agents concurrently,
then orchestrates a final morning brief via GitHub Models (GPT-4o/mini).

## Architecture

```
POST /brief/stream
       │
       ▼
  runSwarm()
  ┌───────────────────────────────────────────────┐
  │  goroutine 1 → Meeting Agent (GitHub Models)  │
  │  goroutine 2 → Inbox Agent   (GitHub Models)  │  ← concurrent
  │  goroutine 3 → Ticket Agent  (GitHub Models)  │
  └──────────────────────┬────────────────────────┘
               WaitGroup.Wait()
                         │
                         ▼
             Orchestrator (GitHub Models)
               dedup + conflict detect
                         │
                         ▼
                  MorningBrief JSON
```

Each agent runs in its own goroutine. A `sync.WaitGroup` blocks until all three
complete. Trace events are streamed to the frontend via Server-Sent Events (SSE)
as they happen — judges can watch the concurrent execution live.

## Quickstart

```bash
# 1. Set your GitHub Token
export GITHUB_TOKEN=your_token_here

# 2. Install dependencies
go mod tidy

# 3. Run
make run

# 4. Test endpoints
make curl-health
make curl-brief
make curl-stream
```

## Endpoints

| Method | Path            | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | /health         | Healthcheck                              |
| POST   | /brief          | Full brief JSON (blocking)               |
| GET    | /brief/stream   | SSE stream — live trace + final brief    |

## SSE Event Types

```json
{ "type": "system",   "message": "Initializing agent swarm..." }
{ "type": "agent",    "agent": "Meeting Agent", "message": "Meeting Agent → parsing 3 transcripts" }
{ "type": "done",     "agent": "Meeting Agent", "message": "Meeting Agent ✓ done (1.2s)" }
{ "type": "conflict", "agent": "Orchestrator",  "message": "Conflict detected: 1 cross-agent conflicts found" }
{ "type": "complete", "message": "Brief ready", "brief": { ... } }
```

## Project Structure

```
teampulse-backend/
├── main.go               # Server entrypoint, routing, graceful shutdown
├── go.mod
├── Makefile
├── Dockerfile
├── models/
│   └── models.go         # All data structs
├── mockdata/
│   └── seed.go           # Realistic mock meetings, emails, tickets
├── ai/
│   └── client.go         # GitHub Models wrapper (Complete, CompleteJSON)
├── agents/
│   ├── meeting_agent.go  # Parses transcripts → decisions/actions
│   ├── inbox_agent.go    # Triages emails → action items
│   ├── ticket_agent.go   # Scans tickets → blockers/deadlines
│   └── orchestrator.go   # Merges + deduplicates + detects conflicts
└── handlers/
    └── handlers.go       # HTTP handlers + concurrent swarm runner
```

## Environment Variables

| Variable         | Required | Default | Description            |
|------------------|----------|---------|------------------------|
| GITHUB_TOKEN     | Yes      | —       | GitHub Token           |
| PORT             | No       | 9090    | HTTP port              |
