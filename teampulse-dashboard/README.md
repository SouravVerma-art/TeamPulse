# TeamPulse — Next.js Frontend

Next.js 14 frontend wired to the Go backend via Server-Sent Events.

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Set backend URL
cp .env.example .env.local
# Edit .env.local → NEXT_PUBLIC_API_URL=http://localhost:9090

# 3. Make sure the Go backend is running
cd ../teampulse-backend && make run

# 4. Start the frontend
npm run dev
# → http://localhost:5050
```

## How the SSE flow works

```
User clicks "Run swarm"
        │
        ▼
useSwarm hook → new EventSource(GET /brief/stream)
        │
        ▼  (events arrive in real time)
   TraceLog  ← type: "agent" | "done" | "conflict"
   AgentPanel← status updates per agent
        │
        ▼  (final event: type: "complete")
   BriefingCard ← populated with MorningBrief JSON
   StatCards    ← updated with real counts
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout, Google Fonts
│   ├── page.tsx         # Main dashboard — wires everything together
│   └── globals.css      # Base styles, Tailwind directives
├── components/
│   ├── Badge.tsx        # Badge, PriorityTag, LabelTag
│   ├── Navbar.tsx       # Top nav with live status indicator
│   ├── StatCard.tsx     # Metric cards with progress bar
│   ├── TraceLog.tsx     # SSE live log viewer (auto-scroll)
│   ├── AgentPanel.tsx   # Per-agent status sidebar
│   ├── BriefingCard.tsx # Main brief output card
│   └── Misc.tsx         # FeatureCards, CTASection, Footer
├── hooks/
│   └── useSwarm.ts      # SSE connection, state machine, agent tracking
├── lib/
│   └── api.ts           # API base URL + endpoint constants
└── types/
    └── index.ts         # TypeScript types matching Go models exactly
```

## Key design decisions

- **`useSwarm` hook** owns the entire SSE lifecycle — open, parse, route to state, close on complete/error. The page just calls `run()` and reads state.
- **EventSource** (not fetch streaming) — native browser API, automatic reconnect, no extra dependencies.
- **Framer Motion Animations** — added fluid animations to the `BriefingCard` and `TraceLog` to provide a premium, modern feel.
- **Agent status** is derived from trace event messages — no separate polling endpoint needed.
- **Fallback states** — `BriefingCard` renders an empty state before any run, a loading state while running, and the full brief once done.
- **Error banner** — if the Go backend is not running, the SSE `onerror` fires and shows a clear message.
