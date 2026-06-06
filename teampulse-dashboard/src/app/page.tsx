"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CalendarDays, ListTodo, Mail, Clock } from "lucide-react";
import { useSwarmContext } from "@/context/SwarmContext";
import { StatCard } from "@/components/StatCard";
import { TraceLog } from "@/components/TraceLog";
import { BriefingCard } from "@/components/BriefingCard";
import { AgentPanel } from "@/components/AgentPanel";
import { Footer } from "@/components/Misc";
import { clsx } from "clsx";
import { ENDPOINTS } from "@/lib/api";
import type { AgentStatus, MorningBrief, TraceEvent } from "@/types";

const NULL_BRIEF: MorningBrief = {
  generated_at: "",
  user_name: "User",
  email_count: 0,
  meeting_count: 0,
  ticket_count: 0,
  conflicts_found: 0,
  agent_results: [],
  insights: [],
};

const INITIAL_AGENTS: AgentStatus[] = [
  { name: "Meeting Agent", icon: "M", status: "waiting", latency: "0ms", parsedN: 0 },
  { name: "Inbox Agent", icon: "I", status: "waiting", latency: "0ms", parsedN: 0 },
  { name: "Ticket Agent", icon: "T", status: "waiting", latency: "0ms", parsedN: 0 },
  { name: "Orchestrator", icon: "O", status: "waiting", latency: "0ms", parsedN: 0 },
];

export default function DashboardPage() {
  const [showTrace, setShowTrace] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { status, traceLines, agents, brief, error, run, reset, userName } = useSwarmContext();

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isRunning = status === "running";
  const displayBrief = brief 
    ? { ...brief, user_name: userName } 
    : { ...NULL_BRIEF, user_name: userName };
  const displayAgents = status === "idle" && !brief ? INITIAL_AGENTS : agents;
  const displayTrace = traceLines;

  const timeStr = currentTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = currentTime?.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  const lastRunTime = displayBrief.generated_at 
    ? new Date(displayBrief.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <div className="min-h-screen bg-canvas-off-white">
      <main className="mx-auto flex w-full max-w-container-max flex-col gap-12 px-gutter py-8">
        <section className="flex flex-col items-start justify-between gap-6 border-b border-outline-variant pb-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <p className="font-mono text-sm uppercase tracking-wide text-on-surface-variant">AI Work Intelligence</p>
              {currentTime && (
                <>
                  <div className="w-1 h-1 rounded-full bg-outline-variant" />
                  <div className="flex items-center gap-1.5 font-mono text-sm font-medium text-ink-black uppercase tracking-wide">
                    <Clock size={14} className="text-on-surface-variant" /> {dateStr} • {timeStr}
                  </div>
                </>
              )}
            </div>
            <h1 className="mb-4 text-5xl font-medium leading-tight tracking-tight text-ink-black md:text-6xl">Your team&apos;s second brain.</h1>
            <p className="text-xl leading-[1.6] text-on-surface-variant">A multi-agent system that watches your team&apos;s conversations and tickets, then delivers one clear, actionable morning brief.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                console.log("Toggle Trace clicked");
                setShowTrace((value) => !value);
              }} 
              className="glass-panel rounded-lg px-6 py-3 font-mono text-sm uppercase tracking-wide text-on-surface-variant hover:text-ink-black active:scale-95"
            >
              {showTrace ? "Hide Trace" : "Show Trace"}
            </button>
            <button 
              onClick={() => {
                console.log("Reset clicked");
                reset();
              }} 
              className="glass-panel rounded-lg px-6 py-3 font-mono text-sm uppercase tracking-wide text-on-surface-variant hover:text-ink-black active:scale-95"
            >
              Reset
            </button>
            <button 
              onClick={() => {
                console.log("Run Swarm clicked");
                run();
              }} 
              disabled={isRunning} 
              className={clsx("rounded-lg bg-ink-black px-6 py-3 font-mono text-sm font-medium uppercase tracking-wide text-white transition-all hover:opacity-90 active:scale-95", isRunning && "cursor-not-allowed opacity-40")}
            >
              {isRunning ? "Running..." : "Run Swarm"}
            </button>
          </div>
        </section>

        {error && <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-base font-medium text-error">{error}</div>}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Emails Processed" value={displayBrief.email_count.toLocaleString()} eyebrow="This Month" sub="Scanned across all inboxes." icon={Mail} settingsHref="/settings#inbox" />
          <StatCard label="Meetings Played" value={displayBrief.meeting_count} eyebrow="This Week" sub="Analysed with decision extraction." icon={CalendarDays} settingsHref="/settings#meetings" />
          <StatCard label="Tickets Scanned" value={displayBrief.ticket_count} eyebrow="Open + Blocked" sub="In Jira and DevOps projects." icon={ListTodo} settingsHref="/settings#tickets" />
          <StatCard label="Conflicts Found" value={displayBrief.conflicts_found} eyebrow="Critical Issues" sub="Requiring immediate resolution." icon={AlertTriangle} alert settingsHref="/settings#conflicts" />
        </section>

        <section id="insights-section" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><BriefingCard brief={displayBrief} status={status} /></div>
          <div className="flex flex-col gap-6">
            <AgentPanel agents={displayAgents} lastRun={lastRunTime} />
            {showTrace && <TraceLog lines={displayTrace} running={isRunning} />}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
