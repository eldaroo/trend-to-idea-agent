"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface StepIndicatorProps {
    runId: Id<"runs"> | null;
}

export function StepIndicator({ runId }: StepIndicatorProps) {
    const run = useQuery(api.runs.getRun, runId ? { runId } : "skip");

    if (!runId || !run) {
        return null;
    }

    const steps = [
        { key: "planning", label: "Planning", icon: "🎯" },
        { key: "researching", label: "Researching", icon: "🔍" },
        { key: "report_ready", label: "Report Ready", icon: "📊" },
        { key: "awaiting_approval", label: "Awaiting Approval", icon: "✋" },
        { key: "ideating", label: "Generating Ideas", icon: "💡" },
        { key: "done", label: "Complete", icon: "✅" },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === run.status);

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                {steps.map((step, idx) => {
                    const isActive = idx === currentStepIndex;
                    const isCompleted = idx < currentStepIndex;
                    const isError = run.status === "error";

                    return (
                        <div key={step.key} className="flex items-center">
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isActive
                                    ? "bg-indigo-600 text-white shadow-lg scale-110"
                                    : isCompleted
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-400"
                                    } ${isError && isActive ? "bg-red-600" : ""}`}
                            >
                                <span className="text-lg">{step.icon}</span>
                                <span className="text-sm font-medium hidden sm:inline">
                                    {step.label}
                                </span>
                            </div>

                            {idx < steps.length - 1 && (
                                <div
                                    className={`w-8 h-0.5 mx-2 ${isCompleted ? "bg-green-400" : "bg-gray-200"
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {run.status === "error" && (
                <div className="mt-4 text-center text-sm text-red-600 font-medium">
                    ⚠️ An error occurred during processing
                </div>
            )}
        </div>
    );
}
