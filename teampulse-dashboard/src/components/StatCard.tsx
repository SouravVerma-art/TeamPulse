import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accentPct?: number;
  settingsLabel?: string;
  settingsHref?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  alert?: boolean;
}

export function StatCard({
  label,
  value,
  sub,
  eyebrow,
  icon: Icon,
  alert,
  settingsHref,
}: StatCardProps) {
  const CardContent = (
    <div className={clsx(
      "glass-panel flex flex-col gap-2 rounded-2xl p-6 h-full transition-all duration-200",
      settingsHref && "hover:border-ink-black hover:-translate-y-1 cursor-pointer"
    )}>
      <div className="flex items-start justify-between gap-3 text-on-surface-variant">
        <p className="font-mono text-base uppercase tracking-wide">
          {label}
        </p>
        {Icon && <Icon className={alert ? "text-error" : ""} size={18} strokeWidth={1.5} />}
      </div>
      <p className="mt-2 text-6xl font-medium tracking-tight text-ink-black">{value}</p>
      {eyebrow && <p className="mt-4 font-mono text-base uppercase tracking-wide text-on-surface-variant">{eyebrow}</p>}
      {sub && <p className="mt-1 text-base text-on-surface-variant">{sub}</p>}
    </div>
  );

  if (settingsHref) {
    return (
      <Link href={settingsHref} className="block h-full">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
