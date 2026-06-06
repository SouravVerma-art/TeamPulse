"use client";

import type { TraceEvent } from "@/types";

export function TraceLog({ lines, running }: { lines: TraceEvent[]; running: boolean }) {
  return (
    <div id="execution-trace" className="h-[400px] flex flex-col rounded-2xl border border-outline-variant bg-white p-6">
      <p className="mb-4 shrink-0 font-mono text-sm uppercase tracking-wide text-ink-black">Detailed Execution Trace</p>
      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-base leading-relaxed text-on-surface-variant opacity-80 pr-2 custom-scrollbar">
        {lines.map((line, index) => <p key={`${line.message}-${index}`}>{line.message}</p>)}
        {running && <p className="animate-pulse text-ink-black">Running swarm...</p>}
              </div>
    </div>
  );
}
