"use client";

import { Badge } from "./Badge";
import type { AgentStatus } from "@/types";
import { useRouter, usePathname } from "next/navigation";

export function AgentPanel({ agents, lastRun }: { agents: AgentStatus[]; lastRun?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const scrollToTrace = () => {
    if (pathname === "/") {
      const element = document.getElementById("execution-trace");
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#execution-trace");
    }
  };

  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-sm uppercase tracking-wide text-ink-black">Active Agents</p>
        {lastRun && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Last Run: {lastRun}</p>
        )}
      </div>
      <div className="flex flex-col gap-5">
        {agents.map((agent) => (
          <div key={agent.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-surface font-mono text-base text-ink-black shadow-sm">{agent.icon}</div>
              <div>
                <p className="font-mono text-base font-medium text-ink-black">{agent.name}</p>
                <p className="mt-0.5 font-mono text-xs text-on-surface-variant uppercase tracking-wider">{agent.parsedN ?? 0} mins / {agent.latency ?? "1 hr"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={agent.status} />
              <button
                onClick={scrollToTrace}
                className="hidden font-mono text-[10px] font-medium uppercase tracking-widest text-on-surface-variant hover:text-ink-black xl:block border border-outline-variant/30 px-2 py-1 rounded-full hover:bg-surface-container transition-all"
              >
                {agent.status === "running" ? "STOP" : "VIEW_LOGS"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <button
          onClick={scrollToTrace}
          className="flex-1 rounded-full border border-outline-variant bg-surface-container py-2 text-center font-mono text-sm font-medium text-on-surface-variant transition-all hover:bg-outline-variant/20 hover:text-ink-black active:scale-[0.98]"
        >
          TRACE_NODE
        </button>
        <button
          onClick={scrollToTrace}
          className="flex-1 rounded-full border border-black/10 bg-ink-black py-2 text-center font-mono text-sm font-medium text-white transition-all hover:bg-ink-black/90 active:scale-[0.98]"
        >
          VIEW_SWARM
        </button>
      </div>
    </div>
  );
}
