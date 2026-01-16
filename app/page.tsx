"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { TopBar } from "../components/TopBar";
import { Stepper } from "../components/Stepper";
import { EventFeed } from "../components/EventFeed";
import { HitlBar } from "../components/HitlBar";
import { IdeasPanel } from "../components/IdeasPanel";

// Force dark mode class on body/html effectively by wrapping content
export default function Home() {
  const [query, setQuery] = useState("");
  const [currentRunId, setCurrentRunId] = useState<Id<"runs"> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createRun = useMutation(api.runs.createRun);

  const currentRun = useQuery(
    api.runs.getRun,
    currentRunId ? { runId: currentRunId } : "skip"
  );

  const handleNewRun = () => {
    setCurrentRunId(null);
    setQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const runId = await createRun({
        userQuery: query,
        constraints: {
          timeframe: "7d",
          region: "Global",
        },
      });

      setCurrentRunId(runId);

      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });

      if (!response.ok) {
        console.error("Orchestration failed:", await response.json());
      }
    } catch (error) {
      console.error("Failed to start run:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproval = async () => {
    if (!currentRunId) return;
    setIsProcessing(true);

    try {
      const response = await fetch("/api/orchestrate/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: currentRunId }),
      });

      if (!response.ok) {
        console.error("Resume failed:", await response.json());
      }
    } catch (error) {
      console.error("Failed to resume:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const showHitlBar =
    currentRun?.status === "report_ready" ||
    currentRun?.status === "awaiting_approval";

  const isRunning =
    currentRun?.status === "planning" ||
    currentRun?.status === "researching" ||
    currentRun?.status === "ideating";

  return (
    <div className="flex flex-col h-screen bg-[#0B0C10] text-[#E0E0E0] overflow-hidden font-sans">
      {/* Top Bar */}
      <TopBar runId={currentRunId} onNewRun={handleNewRun} />

      {/* Stepper */}
      <Stepper runId={currentRunId} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Main stream */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0B0C10] relative">
          <EventFeed runId={currentRunId} />

          {/* HITL Bar */}
          {showHitlBar && currentRunId && (
            <div className="absolute bottom-24 left-0 right-0 z-30 px-6">
              <HitlBar runId={currentRunId} onApprove={handleApproval} />
            </div>
          )}

          {/* Input Form */}
          <div className="p-6 border-t border-white/5 bg-[#0B0C10] relative z-20">
            <form onSubmit={handleSubmit} className="flex gap-4 max-w-4xl mx-auto relative">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ENTER RESEARCH QUERY..."
                  className="w-full pl-6 pr-4 py-4 rounded-lg bg-[#15161A] border border-white/10 text-white placeholder-white/20 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono text-sm tracking-wide shadow-inner input-glow"
                  disabled={isRunning}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                  <span className="text-[10px] text-white/20 font-mono border border-white/10 px-1.5 rounded">CMD+K</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!query.trim() || isRunning}
                className="px-8 py-0 rounded-lg font-bold text-sm tracking-widest uppercase text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
              >
                {isRunning ? (
                  <span className="animate-pulse">PROCESSING</span>
                ) : (
                  "INITIATE"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Ideas Panel */}
        <IdeasPanel runId={currentRunId} />
      </div>
    </div>
  );
}
