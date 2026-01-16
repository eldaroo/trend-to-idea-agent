"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface StepperProps {
    runId: Id<"runs"> | null;
}

// Line art icons
const Icons = {
    planning: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    ),
    researching: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    report: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    approval: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    ideas: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
    ),
    done: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    )
};

const steps = [
    { key: "planning", label: "PLAN", icon: Icons.planning },
    { key: "researching", label: "SEARCH", icon: Icons.researching },
    { key: "report_ready", label: "REPORT", icon: Icons.report },
    { key: "awaiting_approval", label: "DECIDE", icon: Icons.approval },
    { key: "ideating", label: "EXECUTE", icon: Icons.ideas },
    { key: "done", label: "READY", icon: Icons.done },
];

export function Stepper({ runId }: StepperProps) {
    const run = useQuery(api.runs.getRun, runId ? { runId } : "skip");

    if (!runId) return null;

    const currentStepIndex = run ? steps.findIndex((s) => s.key === run.status) : -1;

    return (
        <div className="w-full flex justify-center py-6 border-b border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-4 relative">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -z-10" />

                {steps.map((step, idx) => {
                    const isActive = idx === currentStepIndex;
                    const isCompleted = idx < currentStepIndex;
                    const isUpcoming = idx > currentStepIndex;

                    return (
                        <div key={step.key} className="flex flex-col items-center gap-3 relative group">
                            {/* Icon Circle */}
                            <div
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300
                                    ${isActive
                                        ? 'border-accent bg-accent/10 text-accent shadow-[0_0_15px_rgba(102,252,241,0.3)] scale-110'
                                        : isCompleted
                                            ? 'border-white/20 bg-white/5 text-white/40'
                                            : 'border-white/5 bg-black text-white/10'
                                    }
                                `}
                            >
                                <div className="w-5 h-5">
                                    {isCompleted ? Icons.done : step.icon}
                                </div>
                            </div>

                            {/* Label */}
                            <span
                                className={`
                                    text-[10px] font-mono tracking-widest uppercase transition-colors duration-300 absolute -bottom-6 whitespace-nowrap
                                    ${isActive ? 'text-accent' : isCompleted ? 'text-white/40' : 'text-white/10'}
                                `}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
