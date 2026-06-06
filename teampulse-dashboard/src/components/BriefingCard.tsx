"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { ChevronDown, ChevronUp, ExternalLink, Info, CheckCircle2, AlertCircle, Clock, Zap, Inbox, Users, Ticket, MessageSquareReply, Send, MessageSquare } from "lucide-react";
import { useSwarmContext } from "@/context/SwarmContext";
import { ReplyModal } from "./ReplyModal";
import type { MorningBrief, SwarmStatus, Insight } from "@/types";
import { useRouter, usePathname } from "next/navigation";

const Linkify = ({ text }: { text: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-infrastructure-green hover:underline break-all">
            {part}
          </a>
        ) : part
      )}
    </>
  );
};

export function BriefingCard({ brief, status }: { brief: MorningBrief | null; status: SwarmStatus }) {
  const router = useRouter();
  const pathname = usePathname();
  const { insightActions, getInsightKey, toggleInsightDone, setInsightAssignee, assignInsight } = useSwarmContext();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [assigningKey, setAssigningKey] = useState<string | null>(null);
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const [replyingInsight, setReplyingInsight] = useState<Insight | null>(null);

  if (!brief) return (
    <div className="bg-white border border-outline-variant rounded-2xl p-12 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4">
        <Zap className="text-on-surface-variant animate-pulse" size={24} />
      </div>
      <p className="font-mono text-sm uppercase tracking-wide text-on-surface-variant font-medium">Initializing_Swarm_Nodes</p>
      <p className="text-base text-on-surface-variant mt-2 max-w-[240px]">Agents are scanning your workspace for critical updates...</p>
    </div>
  );

  const TEAM = [
    { name: "Elliot", role: "PM", color: "bg-ink-black" },
    { name: "Alex", role: "Lead", color: "bg-blue-600" },
    { name: "Priya", role: "UX", color: "bg-purple-600" },
    { name: "Marcus", role: "Eng", color: "bg-orange-600" },
    { name: "QA Team", role: "Test", color: "bg-infrastructure-green" },
  ];

  const generatedAt = new Date(brief.generated_at);
  const time = brief.generated_at ? generatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const dateStr = brief.generated_at ? generatedAt.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : "Not yet generated";

  const handleAssign = (insight: any, name: string) => {
    console.log(`Assigning insight to ${name}:`, insight.text);
    setInsightAssignee(insight, name);
    assignInsight(insight);
    setAssigningKey(null);
  };

  const handleResolve = (insight: any) => {
    toggleInsightDone(insight, true);
    setConfirmingKey(null);
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Group insights by agent for better "chunking"
  const visibleInsights = brief.insights.filter(i => !insightActions[getInsightKey(i)]?.done);

  const AGENTS_LIST = ["Inbox Agent", "Meeting Agent", "Ticket Agent", "Orchestrator"];
  const groupedInsights = AGENTS_LIST.reduce((acc, agent) => {
    acc[agent] = visibleInsights.filter(i => i.agent === agent);
    return acc;
  }, {} as Record<string, Insight[]>);

  const AgentIcon = ({ agent, size = 16 }: { agent: string, size?: number }) => {
    if (agent.includes("Meeting")) return <Users size={size} />;
    if (agent.includes("Inbox")) return <Inbox size={size} />;
    if (agent.includes("Ticket")) return <Ticket size={size} />;
    return <Zap size={size} />;
  };

  const getResponseAction = (agent: string) => {
    if (agent.includes("Inbox")) return { label: "Reply", icon: MessageSquareReply };
    if (agent.includes("Meeting")) return { label: "Follow up", icon: Send };
    if (agent.includes("Ticket")) return { label: "Comment", icon: MessageSquare };
    return { label: "Respond", icon: MessageSquareReply };
  };

  const urgentCount = visibleInsights.filter(i => i.priority === "high").length;

  const scrollToInsights = () => {
    if (pathname === "/") {
      const element = document.getElementById("insights-section");
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#insights-section");
    }
  };

  const navigateToAgent = (agent: string) => {
    const agentId = agent.replace(/\s+/g, "");
    if (pathname === "/agents") {
      const element = document.getElementById(agentId);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/agents#${agentId}`);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* --- High-Signal Header --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-medium tracking-tight text-ink-black mb-2">Morning, {brief.user_name}</h2>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-infrastructure-green flex items-center gap-1.5 bg-infrastructure-green/10 px-2.5 py-0.5 rounded-full border border-infrastructure-green/20">
              <span className="w-1 h-1 rounded-full bg-infrastructure-green animate-pulse" /> LIVE_SYNC
            </span>
            <span className="w-1 h-1 rounded-full bg-outline/40" />
            <p className="font-mono text-sm font-medium text-on-surface-variant uppercase tracking-wide">{dateStr} • {time}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="bg-surface-container border border-outline-variant px-4 py-2 rounded-xl flex items-center gap-3">
             <div className="text-center">
               <p className="text-sm font-medium text-ink-black leading-none">{visibleInsights.length}</p>
               <p className="text-sm font-mono uppercase text-on-surface-variant tracking-wide mt-1">Pending</p>
             </div>
             <div className="w-px h-6 bg-outline-variant" />
             <div className="text-center">
               <p className="text-sm font-medium text-error leading-none">{urgentCount}</p>
               <p className="text-sm font-mono uppercase text-on-surface-variant tracking-wide mt-1">Urgent</p>
             </div>
          </div>
        </div>
      </div>

      {/* --- Grouped Actionable Digest --- */}
      <div className="grid grid-cols-1 gap-10">
        {visibleInsights.length > 0 ? (
          Object.entries(groupedInsights)
            .filter(([_, insights]) => insights.length > 0)
            .map(([agent, insights]) => (
              <section key={agent} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-outline-variant pb-2 mb-4">
                  <div className="w-6 h-6 rounded-md bg-ink-black flex items-center justify-center text-white">
                    <AgentIcon agent={agent} size={12} />
                  </div>
                  <h3 className="font-mono text-sm font-medium uppercase tracking-wide text-ink-black">
                    {agent.replace(" Agent", "")}_FEED
                  </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {insights.map((insight, idx) => {
                    const key = getInsightKey(insight);
                    const action = insightActions[key];
                    const isExpanded = expandedKeys.has(key);
                    const isUrgent = insight.priority === "high";
                    const [title, desc = insight.text] = insight.text.split("|");

                    return (
                      <div
                        key={key}
                        className={clsx(
                          "group relative bg-white border rounded-2xl p-4 transition-all duration-300",
                          isUrgent ? "border-error/20 hover:border-error shadow-sm hover:shadow-md" : "border-outline-variant hover:border-ink-black",
                          confirmingKey === key && "ring-2 ring-ink-black ring-offset-2"
                        )}
                      >
                        {confirmingKey === key ? (
                          <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4">
                              <Info className="text-ink-black" size={24} />
                            </div>
                            <h4 className="text-lg font-medium text-ink-black tracking-tight">Work completed?</h4>
                            <p className="text-base text-on-surface-variant mt-1 mb-6 max-w-[280px]">
                              Confirm if this task is finished, or if you just want to clear it from your morning brief.
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                              <button
                                onClick={() => handleResolve(insight)}
                                className="bg-infrastructure-green text-white px-5 py-2 rounded-xl font-medium text-base hover:opacity-90 transition-all active:scale-95 shadow-sm"
                              >
                                Yes, work is done
                              </button>
                              <button
                                onClick={() => handleResolve(insight)}
                                className="border border-outline-variant bg-white text-ink-black px-5 py-2 rounded-xl font-medium text-base hover:bg-surface-container transition-all active:scale-95"
                              >
                                No, just remove
                              </button>
                              <button
                                onClick={() => setConfirmingKey(null)}
                                className="text-on-surface-variant font-mono text-sm uppercase tracking-wide hover:text-ink-black transition-colors w-full mt-2"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => {
                                console.log("Starting resolution for:", title);
                                setConfirmingKey(key);
                              }}
                              className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-outline-variant text-transparent hover:border-ink-black hover:text-on-surface-variant/20 transition-all active:scale-90"
                            >
                              <CheckCircle2 size={14} className="hidden group-hover:block hover:text-ink-black/20" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                  <h4 className="text-base font-medium tracking-tight">
                                    {title}
                                  </h4>
                                  {insight.created_at && (
                                    <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mt-0.5">
                                      Received: {new Date(insight.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                                {isUrgent && (
                                  <span className="flex items-center gap-1 font-mono text-[11px] font-medium text-error uppercase tracking-wider bg-error/5 px-2.5 py-0.5 rounded-full border border-error/10">
                                    <AlertCircle size={10} /> Urgent
                                  </span>
                                )}
                              </div>

                              {desc !== title && (
                                <p className="mt-1 text-base leading-relaxed text-on-surface-variant">
                                  {desc}
                                </p>
                              )}

                              <div className="mt-3 flex items-center gap-3 relative">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setAssigningKey(assigningKey === key ? null : key)}
                                    aria-expanded={assigningKey === key}
                                    aria-haspopup="true"
                                    className={clsx(
                                      "font-mono text-sm font-medium uppercase tracking-wide transition-colors py-1 px-2 rounded-lg flex items-center gap-2",
                                      action?.assignedAt
                                        ? "text-infrastructure-green bg-infrastructure-green/5 border border-infrastructure-green/20"
                                        : "text-on-surface-variant hover:text-ink-black bg-surface-container"
                                    )}
                                  >
                                    {action?.assignedAt ? (
                                      <>
                                        <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-sm text-white", TEAM.find(t => t.name === action.assignee)?.color || "bg-ink-black")}>
                                          {action.assignee.charAt(0)}
                                        </div>
                                        Assigned to {action.assignee}
                                      </>
                                    ) : (
                                      "Delegate Task"
                                    )}
                                  </button>

                                  {assigningKey === key && (
                                    <div className="absolute top-8 left-0 z-50 bg-white border border-outline-variant rounded-xl shadow-2xl p-2 min-w-[160px] animate-in fade-in slide-in-from-top-2">
                                      <p className="font-mono text-sm uppercase tracking-wide text-on-surface-variant mb-2 px-2">Select_Assignee</p>
                                      <div className="grid grid-cols-1 gap-1">
                                        {TEAM.map((member) => (
                                          <button
                                            key={member.name}
                                            onClick={() => handleAssign(insight, member.name)}
                                            className="flex items-center gap-3 w-full p-2 hover:bg-surface-container rounded-lg transition-colors text-left group/member"
                                          >
                                            <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center text-sm text-white font-medium", member.color)}>
                                              {member.name.charAt(0)}
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-ink-black leading-tight group-hover/member:text-on-surface-variant">{member.name}</p>
                                              <p className="text-sm font-mono text-on-surface-variant uppercase tracking-wide">{member.role}</p>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="w-1 h-1 rounded-full bg-outline-variant" />

                                <button
                                  onClick={() => toggleExpand(key)}
                                  className="font-mono text-sm font-medium uppercase tracking-wide text-on-surface-variant hover:text-ink-black transition-colors"
                                  aria-expanded={isExpanded}
                                >
                                  {isExpanded ? "Less" : "Details"}
                                </button>

                                {(() => {
                                  const action = getResponseAction(agent);
                                  const Icon = action.icon;
                                  return (
                                    <>
                                      <div className="w-1 h-1 rounded-full bg-outline-variant" />
                                      <button
                                        onClick={() => setReplyingInsight(insight)}
                                        className="flex items-center gap-1.5 font-mono text-sm font-medium uppercase tracking-wide text-infrastructure-green hover:text-ink-black transition-colors"
                                      >
                                        <Icon size={14} /> {action.label}
                                      </button>
                                    </>
                                  );
                                })()}

                                <button
                                  onClick={() => navigateToAgent(agent)}
                                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-ink-black"
                                  title={`View in ${agent}`}
                                >
                                  <ExternalLink size={14} />
                                </button>
                              </div>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-4 pt-4 border-t border-outline-variant/50 space-y-4">
                                      {insight.source_content && (
                                        <div className="bg-ink-black/[0.02] border border-outline-variant/30 rounded-xl p-4 flex flex-col h-[200px]">
                                          <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-on-surface-variant mb-2 shrink-0">Original_Source</p>
                                          <div className="flex-1 overflow-y-auto text-sm leading-relaxed text-ink-black/80 whitespace-pre-wrap font-sans pr-2 custom-scrollbar">
                                            <Linkify text={insight.source_content} />
                                          </div>
                                        </div>
                                      )}

                                      <div className="bg-surface-container/50 p-3 rounded-xl border border-outline-variant/30">
                                        <p className="font-mono text-sm font-medium uppercase tracking-wide text-on-surface-variant mb-1 flex items-center gap-1.5">
                                          <Info size={10} /> Logic_Trace
                                        </p>
                                        <p className="text-sm leading-relaxed text-on-surface-variant/80">
                                          {insight.reasoning || `Cross-referenced against related records. Prioritized based on your current active projects and upcoming deadlines in ${agent.replace(" Agent", "")}.`}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
        ) : (
          <div className="bg-white border border-outline-variant rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-infrastructure-green/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="text-infrastructure-green" size={24} />
            </div>
            <p className="font-mono text-sm uppercase tracking-wide text-ink-black font-medium">All_Systems_Clear</p>
            <p className="text-base text-on-surface-variant mt-2 max-w-[240px]">No pending actions or urgent alerts found. You're all caught up for now.</p>
          </div>
        )}
      </div>

      {/* --- Footer Status --- */}
      <div className="flex items-center justify-between border-t border-outline-variant pt-6 font-mono text-sm font-medium uppercase tracking-wide text-on-surface-variant">
        <button
          onClick={scrollToInsights}
          className="hover:text-ink-black transition-colors"
        >

        </button>
        <span>{visibleInsights.length} Pending Actions</span>
      </div>

      <ReplyModal
        isOpen={!!replyingInsight}
        onClose={() => setReplyingInsight(null)}
        originalInsight={replyingInsight || { text: "", agent: "" }}
      />
    </div>
  );
}
