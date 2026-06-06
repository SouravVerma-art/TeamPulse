# TeamPulse Hackathon Development Plan

## 1. Project Overview & Hackathon Strategy
**Goal**: Transform TeamPulse into a winning project for the Microsoft Hackathon by showcasing advanced, multi-agent AI capabilities, seamless user experience, and robust architecture.
**Core Pivot**: Transition from Gemini to **GitHub Models (Azure OpenAI compatible)** using `GITHUB_TOKEN`. This bypasses the need for an active Azure subscription while utilizing top-tier AI models, perfectly aligning with the hackathon's constraints and criteria.

## 2. Architecture Improvements
### Backend (Go)
*   **LLM Provider Abstraction**: Refactor the current `gemini/client.go` to a generic `ai/client.go` implementing an interface.
*   **GitHub Models Integration**: Use `github.com/sashabaranov/go-openai` pointing to `https://models.inference.ai.azure.com` (using `GITHUB_TOKEN`).
*   **Concurrency**: Optimize agent orchestration to run the Inbox, Meeting, and Ticket agents concurrently using Go routines and channels.
*   **Real-time Streaming (SSE)**: Implement Server-Sent Events to stream agent thought processes (Trace Logs) to the frontend in real-time.

### Frontend (Next.js & Tailwind)
*   **State Management**: Implement a robust state manager (like Zustand) to handle real-time SSE streams.
*   **Polished UI/UX**: Enhance the `TraceLog` and `BriefingCard` components with smooth animations (Framer Motion) to make the application feel "alive".
*   **Accessibility (A11y)**: Ensure all interactive elements have proper ARIA attributes, semantic HTML, and keyboard navigation to score high on inclusivity.

## 3. Core Features
*   **Intelligent Orchestrator**: A main agent that receives a user query, understands intent, and delegates tasks to specialized sub-agents.
*   **Specialized Sub-agents**:
    *   `InboxAgent`: Summarizes critical emails and flags action items (mocking Outlook).
    *   `MeetingAgent`: Extracts key decisions and action items from transcripts (mocking Teams).
    *   `TicketAgent`: Identifies blocking issues in the sprint (mocking Azure DevOps).
*   **Real-time Traceability**: A side-panel Trace Log that shows *exactly* what the AI is thinking, what tools it is calling, and how it is merging data.

## 4. Scalability & Security
*   **Stateless Agents**: Ensure the Go backend remains completely stateless, allowing horizontal scaling.
*   **Environment Variables**: Strict protection of `GITHUB_TOKEN` and other secrets using `.env` (never committed).
*   **CORS & Rate Limiting**: Secure the API endpoints to only accept requests from the configured frontend URL and prevent abuse.
*   **Caching**: Implement basic in-memory caching to avoid redundant LLM calls for identical queries.

## 5. Execution Steps
1.  [x] **Phase 1: Setup & AI Pivot**
    *   Update backend Go dependencies to include the OpenAI client.
    *   Rewrite `gemini/client.go` into `github_models/client.go`.
    *   Verify connectivity to `models.inference.ai.azure.com`.
2.  [x] **Phase 2: Backend Orchestration & SSE**
    *   Refactor the Orchestrator to support concurrent sub-agent execution.
    *   Implement SSE endpoints to stream updates.
3.  [x] **Phase 3: Frontend Integration**
    *   Connect the Next.js UI to the new SSE endpoints.
    *   Refine the Dashboard layout and animations.
4.  [x] **Phase 4: Polish & Testing**
    *   Conduct end-to-end testing.
    *   Add comments and clear documentation.

## 6. Microsoft Hackathon Judging Criteria Alignment
*   **Innovation**: Using a multi-agent Swarm architecture with real-time thought trace logging provides a transparent and novel AI experience.
*   **Technical Achievement**: Clean Go backend, highly concurrent architecture, smooth SSE streaming, and modern React (Next.js) integration.
*   **Business Value**: Directly addresses information overload in enterprise environments by synthesizing Outlook, Teams, and Azure DevOps data.
