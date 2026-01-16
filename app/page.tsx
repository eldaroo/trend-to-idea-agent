"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ChatPanel } from "../components/ChatPanel";
import { IdeaSidebar } from "../components/IdeaSidebar";
import { StepIndicator } from "../components/StepIndicator";
import { ApprovalControls } from "../components/ApprovalControls";

export default function Home() {
  const [query, setQuery] = useState("");
  const [currentRunId, setCurrentRunId] = useState<Id<"runs"> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createRun = useMutation(api.runs.createRun);

  const currentRun = useQuery(
    api.runs.getRun,
    currentRunId ? { runId: currentRunId } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      // Create run
      const runId = await createRun({
        userQuery: query,
        constraints: {
          timeframe: "7d",
          region: "Global",
        },
      });

      setCurrentRunId(runId);

      // Call the API route to start orchestration
      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Orchestration failed:", error);
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
      // Call API route to resume after approval
      const response = await fetch("/api/orchestrate/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: currentRunId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Resume failed:", error);
      }
    } catch (error) {
      console.error("Failed to resume:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const showApprovalControls =
    currentRun?.status === "report_ready" ||
    currentRun?.status === "awaiting_approval";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold">🔥 Trend-to-Idea Agent</h1>
        <p className="text-indigo-100 mt-1">
          Discover trending topics and generate platform-specific content ideas
        </p>
      </header>

      {/* Step Indicator */}
      <StepIndicator runId={currentRunId} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col">
          <ChatPanel runId={currentRunId} />

          {/* Approval Controls */}
          {showApprovalControls && currentRunId && (
            <div className="p-6 border-t border-gray-200 bg-white">
              <ApprovalControls runId={currentRunId} onApprove={handleApproval} />
            </div>
          )}

          {/* Input Form */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What trends are you interested in? (e.g., 'AI developments this week')"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                disabled={
                  currentRun?.status === "planning" ||
                  currentRun?.status === "researching" ||
                  currentRun?.status === "ideating"
                }
              />
              <button
                type="submit"
                disabled={
                  !query.trim() ||
                  currentRun?.status === "planning" ||
                  currentRun?.status === "researching" ||
                  currentRun?.status === "ideating"
                }
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md"
              >
                {currentRun?.status === "planning" ||
                  currentRun?.status === "researching" ||
                  currentRun?.status === "ideating"
                  ? "Processing..."
                  : "Research"}
              </button>
            </form>
          </div>
        </div>

        {/* Idea Sidebar */}
        <IdeaSidebar runId={currentRunId} />
      </div>
    </div>
  );
}
