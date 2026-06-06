"use client";

import { useSwarmContext } from "@/context/SwarmContext";
import { AgentPanel } from "@/components/AgentPanel";
import { FeatureCards, Footer } from "@/components/Misc";

export default function AgentsPage() {
  const { agents, brief } = useSwarmContext();

  const lastRunTime = brief
    ? new Date(brief.generated_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    : undefined;

  return (
    <div className="min-h-screen bg-canvas-off-white">
      <main className="max-w-container-max mx-auto px-gutter py-12">
        <div className="mb-12">
          <p className="font-mono text-sm uppercase tracking-wide text-on-surface-variant font-medium mb-3">
            SYSTEM_NODES_INDEX
          </p>
          <h1 className="text-5xl font-medium text-ink-black tracking-tight mb-3">
            Active Swarm Agents
          </h1>
          <p className="text-on-surface-variant text-lg max-w-lg leading-relaxed">
            Monitor the status and logical capabilities of specialized nodes within your swarm.
          </p>
        </div>

        <div className="technical-divider">
          <span className="technical-divider-label">NODE_STATUS_MONITOR</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-12">
          <div className="lg:col-span-4">
            <AgentPanel agents={agents} lastRun={lastRunTime} />
          </div>
          <div className="lg:col-span-8">
            <div className="bg-white border border-black/10 p-gutter rounded-2xl">
              <h3 className="text-xl font-medium text-ink-black mb-6 tracking-tight">Agent Capabilities Matrix</h3>
              <div className="space-y-8">
                <div id="MeetingAgent" className="scroll-mt-24">
                  <h4 className="font-mono text-sm font-medium text-ink-black mb-2 uppercase tracking-wide">01_MEETING_AGENT</h4>
                  <p className="text-base text-on-surface-variant leading-relaxed">Uses natural language processing to extract action items and decisions from meeting transcripts. Connects to Teams/Zoom history for high-fidelity data extraction.</p>
                </div>
                <div id="InboxAgent" className="scroll-mt-24">
                  <h4 className="font-mono text-sm font-medium text-ink-black mb-2 uppercase tracking-wide">02_INBOX_AGENT</h4>
                  <p className="text-base text-on-surface-variant leading-relaxed">Triages communications by priority and organizational context. Employs semantic analysis to identify urgent requests and sentiment-heavy threads.</p>
                </div>
                <div id="TicketAgent" className="scroll-mt-24">
                  <h4 className="font-mono text-sm font-medium text-ink-black mb-2 uppercase tracking-wide">03_TICKET_AGENT</h4>
                  <p className="text-base text-on-surface-variant leading-relaxed">Analyzes project management datasets for structural blockers and stagnant tasks. Cross-references tickets with meeting outcomes to detect misalignments.</p>
                </div>
                <div id="Orchestrator" className="scroll-mt-24">
                  <h4 className="font-mono text-sm font-medium text-ink-black mb-2 uppercase tracking-wide">
                    04_ORCHESTRATOR_AGENT
                  </h4>
                  <p className="text-base text-on-surface-variant leading-relaxed">
                    Acts as the central coordinator for all agents. Collects outputs from Meeting, Inbox, and Ticket agents, resolves conflicts, prioritizes tasks, and delivers a single actionable view of team operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="technical-divider">
          <span className="technical-divider-label">SYSTEM_EXTENSIONS</span>
        </div>
        <div className="mb-12">
          <FeatureCards />
        </div>
      </main>
      <Footer />
    </div>
  );
}
