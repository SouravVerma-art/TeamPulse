"use client";

import { useState, useEffect } from "react";
import { Footer } from "@/components/Misc";
import { clsx } from "clsx";
import { ENDPOINTS } from "@/lib/api";
import { useSwarmContext } from "@/context/SwarmContext";

const SOURCE_SETTINGS = [
  {
    id: "meetings",
    title: "Meeting Transcripts",
    description: "Connect calendar recordings and transcript sources.",
    fields: ["Microsoft Teams workspace", "Zoom cloud folder"],
  },
  {
    id: "inbox",
    title: "Inbox Source",
    description: "Choose which mailboxes and labels the Inbox Agent can triage.",
    fields: ["Primary mailbox", "Priority label"],
  },
  {
    id: "tickets",
    title: "Ticket Source",
    description: "Select the project queues scanned for stale work and blockers.",
    fields: ["Jira project", "GitHub repo"],
  },
  {
    id: "conflicts",
    title: "Conflict Detection",
    description: "Tune how aggressively the orchestrator flags cross-source conflicts.",
    fields: ["Risk threshold", "Escalation owner"],
  },
];

export default function SettingsPage() {
  const { refreshSettings } = useSwarmContext();
  const [autoRun, setAutoRun] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean>>({
    "Microsoft Teams": true,
    Slack: false,
    Jira: true,
    GitHub: true,
  });
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    "Microsoft Teams workspace": "Product Launch",
    "Zoom cloud folder": "Launch Readiness",
    "Primary mailbox": "elliot@teampulse.dev",
    "Priority label": "Needs reply",
    "Jira project": "MOB",
    "GitHub repo": "teampulse/app",
    "Risk threshold": "Medium",
    "Escalation owner": "Elliot",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(ENDPOINTS.settings);
        if (res.ok) {
          const data = await res.json();
          setAutoRun(data.auto_run);
          setEmailNotifications(data.email_notifications);
          setIntegrationStatus(data.integration_status);
          setFieldValues(data.field_values);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(ENDPOINTS.settings, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_run: autoRun,
          email_notifications: emailNotifications,
          integration_status: integrationStatus,
          field_values: fieldValues,
        }),
      });
      if (res.ok) {
        setSaveStatus("success");
        await refreshSettings();
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleIntegration = (name: string) => {
    setIntegrationStatus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-off-white flex items-center justify-center">
        <div className="font-mono text-sm animate-pulse uppercase tracking-wide text-on-surface-variant">
          LOADING_CONFIG...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-off-white pb-24">
      <main className="max-w-container-max mx-auto px-gutter py-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-mono text-sm uppercase tracking-wide text-on-surface-variant font-medium mb-3">
              SYSTEM_CONFIGURATION
            </p>
            <h1 className="text-5xl font-medium text-ink-black tracking-tight mb-3">
              Settings
            </h1>
            <p className="text-on-surface-variant text-lg max-w-lg leading-relaxed">
              Configure swarm heuristics, node integrations, and deployment parameters.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {saveStatus === "success" && (
              <span className="font-mono text-sm text-infrastructure-green font-medium">
                CHANGES_COMMITTED
              </span>
            )}
            {saveStatus === "error" && (
              <span className="font-mono text-sm text-red-500 font-medium">
                SAVE_FAILED
              </span>
            )}
            <button
            onClick={saveSettings}
            disabled={isSaving}
            className={clsx(
              "h-12 px-8 bg-ink-black text-white font-mono text-sm font-medium uppercase tracking-wide rounded-xl transition-all hover:bg-ink-black/90 active:scale-[0.98] disabled:opacity-50",
              isSaving && "animate-pulse"
            )}
            >
            {isSaving ? "SAVING..." : "COMMIT_CHANGES"}
            </button>
            </div>
            </div>

            <div className="space-y-gutter">
            <div className="technical-divider">
            <span className="technical-divider-label">GLOBAL_PARAMETERS</span>
            </div>

            <section className="bg-white border border-black/10 p-gutter rounded-2xl">
            <h3 className="text-xl font-medium text-ink-black mb-6 tracking-tight">General Configuration</h3>
            <div className="space-y-4">
            <SettingToggle
              checked={autoRun}
              label="Auto-run Swarm"
              description="Automatically execute swarm logic daily at 08:00 UTC."
              onChange={setAutoRun}
            />
            <SettingToggle
              checked={emailNotifications}
              label="Status Reports"
              description="Dispatch telemetry reports via email upon task completion."
              onChange={setEmailNotifications}
            />
            </div>
            </section>

            <div className="technical-divider">
            <span className="technical-divider-label">EXTERNAL_NODES</span>
            </div>

            <section className="bg-white border border-black/10 p-gutter rounded-2xl">
            <h3 className="text-xl font-medium text-ink-black mb-6 tracking-tight">Integration Handshakes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(integrationStatus).map(([item, connected]) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleIntegration(item)}
                className="p-4 border border-black/10 flex items-center justify-between text-left transition-all hover:border-ink-black/30 hover:bg-black/5 rounded-xl group active:scale-[0.98]"
              >
                <span className="font-mono text-sm font-medium uppercase tracking-wide text-ink-black">{item.replace(" ", "_")}</span>
                <span
                  className={clsx(
                    "flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full transition-colors",
                    connected ? "bg-infrastructure-green/10 text-infrastructure-green border border-infrastructure-green/20" : "bg-black/5 text-on-surface-variant border border-black/10"
                  )}
                >
                  <span className={clsx("w-1.5 h-1.5 rounded-full", connected ? "bg-infrastructure-green" : "bg-on-surface-variant/40")} />
                  {connected ? "ACTIVE_CONNECTION" : "NODE_OFFLINE"}
                </span>
              </button>
            ))}
            </div>
            </section>

            {SOURCE_SETTINGS.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-24 space-y-gutter">
            <div className="technical-divider">
              <span className="technical-divider-label">DATA_SOURCE::{section.id.toUpperCase()}</span>
            </div>
            <section className="bg-white border border-black/10 p-gutter rounded-2xl">
              <div className="mb-8">
                <h3 className="text-xl font-medium text-ink-black tracking-tight">
                  {section.title}
                </h3>
                <p className="mt-1 text-base text-on-surface-variant">
                  {section.description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {section.fields.map((field) => (
                  <label key={field} className="block">
                    <span className="mb-2 block font-mono text-sm font-medium uppercase tracking-wide text-on-surface-variant">
                      {field.replace(" ", "_")}
                    </span>
                    <input
                      value={fieldValues[field] ?? ""}
                      onChange={(e) =>
                        setFieldValues((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 font-mono text-base text-ink-black outline-none focus:border-ink-black transition-colors"
                    />
                  </label>
                ))}
              </div>
            </section>
            </div>
            ))}

            <div className="pt-12 flex justify-center">
            <button
            onClick={saveSettings}
            disabled={isSaving}
            className={clsx(
              "h-14 px-12 bg-ink-black text-white font-mono text-base font-medium uppercase tracking-wide rounded-xl transition-all hover:bg-ink-black/90 active:scale-[0.98] disabled:opacity-50 shadow-xl",
              isSaving && "animate-pulse"
            )}
            >
            {isSaving ? "SAVING_CHANGES..." : "COMMIT_ALL_CHANGES"}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SettingToggle({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-4 text-left border-b border-black/5 last:border-b-0 group"
      aria-pressed={checked}
    >
      <span>
        <span className="block text-lg font-medium text-ink-black tracking-tight">{label}</span>
        <span className="block text-base text-on-surface-variant mt-0.5">{description}</span>
      </span>
      <div
        className={clsx(
          "relative h-5 w-10 flex-shrink-0 rounded-full transition-colors border",
          checked ? "bg-ink-black border-ink-black" : "bg-black/5 border-black/10"
        )}
      >
        <div
          className={clsx(
            "absolute top-0.5 h-3.5 w-3.5 rounded-full transition-transform",
            checked ? "translate-x-[22px] bg-white" : "translate-x-0.5 bg-ink-black/20"
          )}
        />
      </div>
    </button>
  );
}
