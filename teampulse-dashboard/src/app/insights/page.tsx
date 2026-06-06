"use client";

import { useSwarmContext } from "@/context/SwarmContext";
import { BriefingCard } from "@/components/BriefingCard";
import { Footer } from "@/components/Misc";

export default function InsightsPage() {
  const { brief, status, userName } = useSwarmContext();

  const displayBrief = brief 
    ? { ...brief, user_name: userName } 
    : brief;

  return (
    <div className="min-h-screen bg-canvas-off-white">
      <main className="max-w-container-max mx-auto px-gutter py-12">
        <div className="mb-12">
          <p className="font-mono text-sm uppercase tracking-wide text-on-surface-variant font-medium mb-3">
            INTELLIGENCE_REPOSITORY
          </p>
          <h1 className="text-5xl font-medium text-ink-black tracking-tight mb-3">
            System Insights
          </h1>
          <p className="text-on-surface-variant text-lg max-w-lg leading-relaxed">
            Historical synthesis and cross-node patterns identified during swarm execution.
          </p>
        </div>

        <div className="technical-divider">
          <span className="technical-divider-label">CURRENT_INTELLIGENCE_BRIEF</span>
        </div>

        <div id="insights-section" className="mb-12 scroll-mt-24">
          {displayBrief ? (
            <BriefingCard brief={displayBrief} status={status} />
          ) : (
             status === "running" && <BriefingCard brief={{ user_name: userName } as any} status={status} />
          )}
        </div>

        {!brief && status !== "running" && (
          <div className="bg-white border border-black/10 p-12 text-center rounded-2xl">
            <p className="font-mono text-base uppercase tracking-wide text-on-surface-variant">
              NULL_DATA_DETECTED // EXECUTE_SWARM_TO_POPULATE
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
