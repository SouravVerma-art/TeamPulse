import { InsightPriority, InsightLabel } from "@/types";
import { clsx } from "clsx";

type BadgeVariant =
  | InsightPriority
  | "delivered"
  | "archived"
  | "active"
  | "idle"
  | "waiting"
  | "running"
  | "done"
  | "error";

const STYLES: Record<BadgeVariant, string> = {
  // priority
  high:      "bg-error/10 text-error",
  medium:    "bg-warning-amber/10 text-warning-amber",
  low:       "bg-infrastructure-green/10 text-infrastructure-green",
  // status
  delivered: "bg-infrastructure-green/10 text-infrastructure-green",
  archived:  "bg-warning-amber/10 text-warning-amber",
  active:    "bg-infrastructure-green/10 text-infrastructure-green",
  idle:      "bg-black/5 text-on-surface-variant border border-black/10",
  waiting:   "bg-black/5 text-on-surface-variant border border-black/10",
  running:   "bg-warning-amber/10 text-warning-amber",
  done:      "bg-infrastructure-green/10 text-infrastructure-green",
  error:     "bg-error/10 text-error",
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

const DOT_COLORS: Partial<Record<BadgeVariant, string>> = {
  done: "bg-infrastructure-green",
  running: "bg-warning-amber animate-pulse",
  active: "bg-infrastructure-green",
  error: "bg-error",
  waiting: "bg-on-surface-variant/40",
};

export function Badge({ variant, label, className }: BadgeProps) {
  const dotColor = DOT_COLORS[variant];
  
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-mono text-sm font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full whitespace-nowrap",
        STYLES[variant] ?? STYLES.idle,
        className
      )}
    >
      {dotColor && <span className={clsx("w-1.5 h-1.5 rounded-full", dotColor)} />}
      {label ?? variant}
    </span>
  );
}

// Priority tag with fixed width for alignment in briefing cards.
export function PriorityTag({ priority }: { priority: InsightPriority }) {
  return (
    <span
      className={clsx(
        "inline-block font-mono text-sm font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full whitespace-nowrap min-w-[72px] text-center",
        STYLES[priority]
      )}
    >
      {priority}
    </span>
  );
}

// Label tag for insight type (Decision, Blocker, etc.)
export function LabelTag({ label }: { label: InsightLabel }) {
  const labelStyles: Record<InsightLabel, string> = {
    Decision: "bg-surface-container-high text-ink-black border border-black/10",
    Blocker:  "bg-error/10 text-error",
    Conflict: "bg-error/10 text-error",
    Action:   "bg-warning-amber/10 text-warning-amber",
    Update:   "bg-black/5 text-on-surface-variant border border-black/10",
  };
  return (
    <span
      className={clsx(
        "inline-block font-mono text-sm font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full whitespace-nowrap",
        labelStyles[label] ?? "bg-black/5 text-on-surface-variant"
      )}
    >
      {label}
    </span>
  );
}
