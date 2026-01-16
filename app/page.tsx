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
  const [showIdeasPanel, setShowIdeasPanel] = useState(false);

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
    setCurrentRunId(null);

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

  // Handler for Refine - re-runs the entire search with new constraints
  const handleRefine = async () => {
    if (!currentRunId) return;
    setIsProcessing(true);

    try {
      // Call the main orchestrate endpoint again to re-run research
      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: currentRunId }),
      });

      if (!response.ok) {
        console.error("Refine failed:", await response.json());
      }
    } catch (error) {
      console.error("Failed to refine:", error);
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

  // Show ideas count for the floating button
  const ideasEvents = useQuery(
    api.events.getEventsBySurface,
    currentRunId ? { runId: currentRunId, surface: "sidebar" } : "skip"
  );
  const ideasCount = ideasEvents?.filter((e: any) => e.type === "idea").length || 0;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans relative selection:bg-[#0A84FF]/30">
      {/* Background Gradients for Glass Effect */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#0A84FF] rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#30D158] rounded-full mix-blend-screen filter blur-[120px] opacity-5 pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Top Bar */}
      <TopBar runId={currentRunId} onNewRun={handleNewRun} />

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Main Area - Takes full width on mobile */}
        <div className="flex-1 flex flex-col min-w-0">
          <Stepper runId={currentRunId} />

          <div className="flex-1 relative overflow-hidden flex flex-col">
            <EventFeed runId={currentRunId} />

            {/* HITL Overlay */}
            {showHitlBar && currentRunId && (
              <div className="absolute bottom-28 sm:bottom-32 left-2 right-2 sm:left-0 sm:right-0 sm:px-6 z-50 flex justify-center">
                <HitlBar runId={currentRunId} onApprove={handleApproval} onRefine={handleRefine} />
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 sm:p-6 pb-6 sm:pb-8 bg-gradient-to-t from-black to-transparent">
              <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 max-w-3xl mx-auto relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for trends..."
                  className="w-full h-12 sm:h-14 pl-4 sm:pl-6 pr-24 sm:pr-32 rounded-[20px] sm:rounded-[24px] bg-[#1C1C1E] border border-white/5 text-[15px] sm:text-[16px] text-white placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] transition-all shadow-lg"
                  disabled={isRunning}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isRunning}
                  className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 h-9 sm:h-10 px-4 sm:px-6 rounded-[16px] sm:rounded-[20px] bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-[13px] sm:text-[14px] transition-all disabled:opacity-50 disabled:bg-[#2C2C2E] flex items-center justify-center"
                >
                  {isRunning ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Go"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Ideas Panel - Hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block">
          <IdeasPanel runId={currentRunId} />
        </div>

        {/* Mobile: Ideas Panel Drawer - Always rendered for transitions */}
        <div className={`lg:hidden fixed inset-0 z-50 transition-colors duration-300 ${showIdeasPanel ? 'pointer-events-auto' : 'pointer-events-none delay-300'}`}>
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showIdeasPanel ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setShowIdeasPanel(false)}
          />
          {/* Panel */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-[85vw] max-w-[380px] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showIdeasPanel ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <IdeasPanel
              runId={currentRunId}
              onClose={() => setShowIdeasPanel(false)}
              isMobile={true}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Floating Ideas Button */}
      <button
        onClick={() => setShowIdeasPanel(prev => !prev)}
        className="lg:hidden fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[#0A84FF] shadow-lg shadow-blue-500/30 flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {ideasCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#30D158] text-white text-[11px] font-bold flex items-center justify-center">
            {ideasCount}
          </span>
        )}
      </button>
    </div>
  );
}
