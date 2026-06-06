"use client";

import { useState, useCallback, useRef } from "react";
import {
  TraceEvent,
  MorningBrief,
  SwarmStatus,
  AgentStatus,
} from "@/types";
import { ENDPOINTS } from "@/lib/api";

const INITIAL_AGENTS: AgentStatus[] = [
  { name: "Meeting Agent", icon: "M", status: "waiting" },
  { name: "Inbox Agent", icon: "I", status: "waiting" },
  { name: "Ticket Agent", icon: "T", status: "waiting" },
  { name: "Orchestrator", icon: "O", status: "waiting" },
];

export interface SwarmState {
  status: SwarmStatus;
  traceLines: TraceEvent[];
  agents: AgentStatus[];
  brief: MorningBrief | null;
  error: string | null;
}

export interface SwarmControls {
  run: () => void;
  reset: () => void;
}

export function useSwarm(): [SwarmState, SwarmControls] {
  const [status, setStatus]     = useState<SwarmStatus>("idle");
  const [traceLines, setTrace]  = useState<TraceEvent[]>([]);
  const [agents, setAgents]     = useState<AgentStatus[]>(INITIAL_AGENTS);
  const [brief, setBrief]       = useState<MorningBrief | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // Keep a ref so we can close the EventSource from reset()
  const esRef = useRef<EventSource | null>(null);

  const updateAgent = useCallback(
    (name: string, patch: Partial<AgentStatus>) => {
      setAgents((prev) =>
        prev.map((a) => (a.name === name ? { ...a, ...patch } : a))
      );
    },
    []
  );

  const run = useCallback(() => {
    // Close any previous connection
    esRef.current?.close();
    esRef.current = null;

    // Reset state
    setStatus("running");
    setTrace([]);
    setBrief(null);
    setError(null);
    setAgents(INITIAL_AGENTS);

    const es = new EventSource(ENDPOINTS.briefStream);
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      let event: TraceEvent;
      try {
        event = JSON.parse(e.data) as TraceEvent;
      } catch {
        return;
      }

      // Append to trace log
      setTrace((prev) => [...prev, event]);

      // Update per-agent status based on trace event type + agent name
      if (event.type === "agent" && event.agent) {
        updateAgent(event.agent, { status: "running" });
      }

      if (event.type === "done" && event.agent) {
        // Parse latency from messages such as "Meeting Agent done (1.2s)".
        const latencyMatch = event.message.match(/\((\d+\.\d+s)\)/);
        updateAgent(event.agent, {
          status: "done",
          latency: latencyMatch?.[1],
        });
      }

      if (event.type === "complete") {
        if (event.brief) {
          // Attach parsed_n to each agent from brief.agent_results
          setAgents((prev) =>
            prev.map((a) => {
              if (a.name === "Orchestrator") {
                return { ...a, status: "done" };
              }
              const result = event.brief!.agent_results?.find(
                (r) => r.agent_name === a.name
              );
              return result
                ? { ...a, status: "done", parsedN: result.parsed_n }
                : a;
            })
          );
          setBrief(event.brief);
        }
        setStatus("done");
        es.close();
        esRef.current = null;
      }

      if (event.type === "error") {
        setError(event.message);
        setStatus("error");
        es.close();
        esRef.current = null;
      }
    };

    es.onerror = () => {
      setError("Connection to backend lost. Is the Go server running?");
      setStatus("error");
      es.close();
      esRef.current = null;
    };
  }, [updateAgent]);

  const reset = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setStatus("idle");
    setTrace([]);
    setAgents(INITIAL_AGENTS);
    setBrief(null);
    setError(null);
  }, []);

  return [{ status, traceLines, agents, brief, error }, { run, reset }];
}
