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
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans relative selection:bg-[#0A84FF]/30">
      {/* Background Gradients for Glass Effect */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#0A84FF] rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#30D158] rounded-full mix-blend-screen filter blur-[120px] opacity-5 pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Top Bar */}
      <TopBar runId={currentRunId} onNewRun={handleNewRun} />

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left: Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Stepper runId={currentRunId} />

          <div className="flex-1 relative overflow-hidden flex flex-col">
            <EventFeed runId={currentRunId} />

            {/* HITL Overlay */}
            {showHitlBar && currentRunId && (
              <div className="absolute bottom-32 left-0 right-0 px-6 z-50 flex justify-center">
                <HitlBar runId={currentRunId} onApprove={handleApproval} />
              </div>
            )}

            {/* Input Area */}
            <div className="p-6 pb-8 bg-gradient-to-t from-black to-transparent">
              <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for trends..."
                  className="w-full h-14 pl-6 pr-32 rounded-[24px] bg-[#1C1C1E] border border-white/5 text-[16px] text-white placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] transition-all shadow-lg"
                  disabled={isRunning}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isRunning}
                  className="absolute right-2 top-2 h-10 px-6 rounded-[20px] bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-[14px] transition-all disabled:opacity-50 disabled:bg-[#2C2C2E] flex items-center justify-center"
                >
                  {isRunning ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Initiate"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Ideas Panel */}
        <IdeasPanel runId={currentRunId} />
      </div>
    </div>
  );
}
