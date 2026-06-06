"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  TraceEvent,
  MorningBrief,
  SwarmStatus,
  AgentStatus,
  Insight,
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
  userName: string;
}

export interface SwarmControls {
  run: () => void;
  reset: () => void;
  toggleInsightDone: (insight: Insight, checked: boolean) => void;
  setInsightAssignee: (insight: Insight, assignee: string) => void;
  assignInsight: (insight: Insight) => void;
  refreshSettings: () => Promise<void>;
}

export interface InsightActionState {
  assignee: string;
  assignedAt?: string;
  done: boolean;
}

interface SwarmContextType extends SwarmState, SwarmControls {
  insightActions: Record<string, InsightActionState>;
  getInsightKey: (insight: Insight) => string;
  userName: string;
}

const SwarmContext = createContext<SwarmContextType | undefined>(undefined);

export function SwarmProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus]     = useState<SwarmStatus>("idle");
  const [traceLines, setTrace]  = useState<TraceEvent[]>([]);
  const [agents, setAgents]     = useState<AgentStatus[]>(INITIAL_AGENTS);
  const [brief, setBrief]       = useState<MorningBrief | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [insightActions, setInsightActions] = useState<
    Record<string, InsightActionState>
  >({});

  const esRef = useRef<EventSource | null>(null);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch(ENDPOINTS.settings);
      if (res.ok) {
        const data = await res.json();
        if (data.field_values?.["Escalation owner"]) {
          setUserName(data.field_values["Escalation owner"]);
        }
      }
    } catch (err) {
      console.error("Failed to refresh settings in context:", err);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const getInsightKey = useCallback((insight: Insight) => {
    return `${insight.agent}:${insight.label}:${insight.text}`;
  }, []);

  const updateAgent = useCallback(
    (name: string, patch: Partial<AgentStatus>) => {
      setAgents((prev) =>
        prev.map((a) => (a.name === name ? { ...a, ...patch } : a))
      );
    },
    []
  );

  const run = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;

    setStatus("running");
    setTrace([]);
    setBrief(null);
    setError(null);
    setAgents(INITIAL_AGENTS);
    setInsightActions({});

    const es = new EventSource(ENDPOINTS.briefStream);
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      let event: TraceEvent;
      try {
        event = JSON.parse(e.data) as TraceEvent;
      } catch {
        return;
      }

      setTrace((prev) => [...prev, event]);

      if (event.type === "agent" && event.agent) {
        updateAgent(event.agent, { status: "running" });
      }

      if (event.type === "done" && event.agent) {
        const latencyMatch = event.message.match(/\((\d+\.\d+s)\)/);
        updateAgent(event.agent, {
          status: "done",
          latency: latencyMatch?.[1],
        });
      }

      if (event.type === "complete") {
        if (event.brief) {
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
    setInsightActions({});
  }, []);

  const toggleInsightDone = useCallback(
    (insight: Insight, checked: boolean) => {
      const key = getInsightKey(insight);
      setInsightActions((prev) => ({
        ...prev,
        [key]: {
          assignee: prev[key]?.assignee ?? "",
          assignedAt: prev[key]?.assignedAt,
          done: checked,
        },
      }));
    },
    [getInsightKey]
  );

  const setInsightAssignee = useCallback(
    (insight: Insight, assignee: string) => {
      const key = getInsightKey(insight);
      setInsightActions((prev) => ({
        ...prev,
        [key]: {
          assignee,
          assignedAt: assignee ? prev[key]?.assignedAt : undefined,
          done: prev[key]?.done ?? false,
        },
      }));
    },
    [getInsightKey]
  );

  const assignInsight = useCallback(
    (insight: Insight) => {
      const key = getInsightKey(insight);
      setInsightActions((prev) => {
        const current = prev[key];
        if (!current?.assignee) return prev;

        return {
          ...prev,
          [key]: {
            ...current,
            assignedAt: new Date().toISOString(),
          },
        };
      });
    },
    [getInsightKey]
  );

  return (
    <SwarmContext.Provider
      value={{
        status,
        traceLines,
        agents,
        brief,
        error,
        userName,
        insightActions,
        getInsightKey,
        run,
        reset,
        toggleInsightDone,
        setInsightAssignee,
        assignInsight,
        refreshSettings,
      }}
    >
      {children}
    </SwarmContext.Provider>
  );
}

export function useSwarmContext() {
  const context = useContext(SwarmContext);
  if (context === undefined) {
    throw new Error("useSwarmContext must be used within a SwarmProvider");
  }
  return context;
}
