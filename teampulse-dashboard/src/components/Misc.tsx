import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight, ArrowUpRight, LockKeyhole } from "lucide-react";

const FEATURES = [
  {
    icon: "M",
    label: "Meeting Agent",
    title: "Transcripts to Decisions",
    desc: "Parses meeting notes to extract decisions, blockers, and owners automatically.",
    config: "Configure transcripts",
    href: "/settings#meetings",
  },
  {
    icon: "I",
    label: "Inbox Agent",
    title: "Emails to Actions",
    desc: "Triages your inbox and surfaces threads that need your attention today.",
    config: "Configure inbox",
    href: "/settings#inbox",
  },
  {
    icon: "T",
    label: "Ticket Agent",
    title: "Tickets to Blockers",
    desc: "Scans Jira/DevOps for stale tasks, conflicts, and dependency chains.",
    config: "Configure tickets",
    href: "/settings#tickets",
  },
];

export function FeatureCards() {
  return (
    <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      {FEATURES.map((f, i) => (
        <div
          key={i}
          className="bg-white border border-black/10 p-6 rounded-2xl transition-all duration-200 hover:border-black/20 hover:-translate-y-0.5"
        >
          <span className="font-mono text-3xl font-medium block mb-6 text-ink-black/20">{f.icon}</span>
          <p className="font-mono text-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">
            {f.label}
          </p>
          <h4 className="text-lg font-medium text-ink-black mb-2 tracking-tight">
            {f.title}
          </h4>
          <p className="text-base text-on-surface-variant leading-relaxed mb-6">{f.desc}</p>
          <Link
            href={f.href}
            className="inline-block font-mono text-sm font-medium text-ink-black uppercase tracking-wide border-b border-black/10 hover:border-ink-black transition-colors"
            aria-label={`Edit configuration for ${f.label}`}
            title={f.config}
          >
            EDIT_CONFIG
          </Link>
        </div>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 border-t border-outline-variant bg-surface">
      <div className="mx-auto max-w-container-max px-gutter pt-14">
        <div className="grid grid-cols-1 gap-10 pb-16 sm:grid-cols-2 lg:grid-cols-[1.55fr_1fr_1fr] lg:gap-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-black transition-transform group-hover:scale-105">
                <span className="text-[20px] font-semibold leading-none text-white">t</span>
              </div>
              <span className="text-[20px] font-semibold tracking-tight text-ink-black">
                TeamPulse
              </span>
            </Link>
            <p className="mt-4 max-w-[340px] text-base leading-relaxed text-on-surface-variant">
              Decision infrastructure for teams shipping AI agents. Queryable.
              Reviewable. Auditable.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-12 items-center gap-3 rounded-xl border border-black/10 bg-white px-6 text-base font-medium text-ink-black transition-colors hover:border-black/25"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { label: "Features", href: "/#features" },
              { label: "Execution Trace", href: "/#insights-section" },
              { label: "Agent Status", href: "/agents" },
              { label: "System Insights", href: "/insights" },
            ]}
          />
          <FooterColumn
            title="Resources"
            links={[
              { label: "Documentation", href: "/insights" },
              { label: "API Reference", href: "/insights" },
              { label: "Dashboard", href: "/" },
              { label: "Settings", href: "/settings" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-outline-variant py-8 font-mono text-sm tracking-wide text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <p>(c) TeamPulse Labs, Inc. - Microsoft Hackathon 2026</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/settings" className="transition-colors hover:text-ink-black">
              Privacy
            </Link>
            <Link href="/settings" className="transition-colors hover:text-ink-black">
              Terms
            </Link>
            <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-ink-black">
              Dashboard
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string; locked?: boolean }>;
}) {
  return (
    <div>
      <p className="mb-5 text-sm font-medium uppercase tracking-wide text-on-surface-variant">
        {title}
      </p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="inline-flex items-center gap-2 text-base text-ink-black transition-colors hover:text-on-surface-variant"
            >
              {link.locked && <LockKeyhole className="h-4 w-4" strokeWidth={1.75} />}
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
