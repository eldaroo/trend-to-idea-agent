"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface ApprovalControlsProps {
    runId: Id<"runs">;
    onApprove: () => void;
}

export function ApprovalControls({ runId, onApprove }: ApprovalControlsProps) {
    const [showRefineModal, setShowRefineModal] = useState(false);
    const [refinement, setRefinement] = useState("");
    const [timeframe, setTimeframe] = useState("7d");
    const [region, setRegion] = useState("Global");

    const setApproval = useMutation(api.runs.setApproval);
    const updateConstraints = useMutation(api.runs.updateConstraints);

    const handleApprove = async () => {
        await setApproval({ runId, approval: "approved" });
        onApprove();
    };

    const handleRefine = async () => {
        await updateConstraints({
            runId,
            constraints: {
                timeframe,
                region,
            },
        });
        await setApproval({
            runId,
            approval: "refine",
            refinement,
        });
        setShowRefineModal(false);
        onApprove();
    };

    const handleRestart = async () => {
        await setApproval({ runId, approval: "restart" });
        onApprove();
    };

    return (
        <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
                ✋ Human-in-the-Loop Checkpoint
            </h3>
            <p className="text-sm text-gray-700 mb-4">
                Review the research report above. What would you like to do?
            </p>

            <div className="flex gap-3">
                <button
                    onClick={handleApprove}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
                >
                    ✅ Approve & Generate Ideas
                </button>

                <button
                    onClick={() => setShowRefineModal(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
                >
                    🔧 Refine Search
                </button>

                <button
                    onClick={handleRestart}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
                >
                    🔄 Restart
                </button>
            </div>

            {showRefineModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Refine Research Parameters
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Timeframe
                                </label>
                                <select
                                    value={timeframe}
                                    onChange={(e) => setTimeframe(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="24h">Last 24 hours</option>
                                    <option value="7d">Last 7 days</option>
                                    <option value="30d">Last 30 days</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Region
                                </label>
                                <select
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Global">Global</option>
                                    <option value="US">United States</option>
                                    <option value="Europe">Europe</option>
                                    <option value="Asia">Asia</option>
                                    <option value="Latin America">Latin America</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Instructions (optional)
                                </label>
                                <textarea
                                    value={refinement}
                                    onChange={(e) => setRefinement(e.target.value)}
                                    placeholder="E.g., Focus more on technology trends, exclude political news..."
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleRefine}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                                Apply & Re-search
                            </button>
                            <button
                                onClick={() => setShowRefineModal(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
