// Insight types
export type InsightPriority = "high" | "medium" | "low";

export type InsightLabel =
  | "Decision"
  | "Blocker"
  | "Conflict"
  | "Action"
  | "Update";

export interface Insight {
  label: InsightLabel;
  text: string;
  priority: InsightPriority;
  agent: string;
  reasoning?: string;
  created_at?: string;
  source_content?: string;
}

// Agent result
export interface AgentResult {
  agent_name: string;
  insights: Insight[];
  latency: string;
  parsed_n: number;
  error?: string;
}

// Morning brief
export interface MorningBrief {
  generated_at: string;
  user_name: string;
  email_count: number;
  meeting_count: number;
  ticket_count: number;
  insights: Insight[];
  conflicts_found: number;
  agent_results: AgentResult[];
}

// SSE trace events
export type TraceEventType =
  | "system"
  | "agent"
  | "done"
  | "conflict"
  | "complete"
  | "error";

export interface TraceEvent {
  type: TraceEventType;
  message: string;
  agent?: string;
  // Only present on type === "complete"
  brief?: MorningBrief;
}

// Swarm status
export type SwarmStatus = "idle" | "running" | "done" | "error";

export interface AgentStatus {
  name: string;
  icon: string;
  status: "waiting" | "running" | "done" | "error";
  latency?: string;
  parsedN?: number;
}
