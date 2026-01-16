"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface StepperProps {
    runId: Id<"runs"> | null;
}

const steps = [
    { key: "planning", label: "Plan", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" }, // Map
    { key: "researching", label: "Research", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }, // Search
    { key: "report_ready", label: "Report", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }, // Doc
    { key: "awaiting_approval", label: "Approval", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }, // Check Circle
    { key: "ideating", label: "Ideate", icon: "M13 10V3L4 14h7v7l9-11h-7z" }, // Bolt
    { key: "done", label: "Done", icon: "M5 13l4 4L19 7" } // Check
];

export function Stepper({ runId }: StepperProps) {
    const run = useQuery(api.runs.getRun, runId ? { runId } : "skip");

    // Don't render empty state if no run, or render a placeholder? 
    // Usually stepper shows initial state.
    const currentStepIndex = run ? steps.findIndex((s) => s.key === run.status) : 0;

    // Safety check if run status isn't found (e.g. error) default to 0
    const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

    return (
        <div className="w-full max-w-3xl mx-auto pt-6 pb-4 flex justify-center px-4">
            {/* Main Pill Container (Track) */}
            <div className="relative flex w-full h-[52px] bg-[#1C1C1E]/80 backdrop-blur-xl rounded-full p-1.5 border border-white/10 shadow-[inner_0_1px_2px_rgba(0,0,0,0.5)]">

                {/* Visual Glass Reflection (Top Border) */}
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 pointer-events-none" />

                {/* Sliding Bubble Indicator */}
                {/* 
                   Width = 100% / 6 steps ~= 16.666%
                   TranslateX = 100% * activeIndex
                */}
                <div
                    className="absolute top-1.5 bottom-1.5 rounded-full bg-[#0A84FF] shadow-[0_2px_10px_rgba(10,132,255,0.3)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-0"
                    style={{
                        width: `calc((100% - 12px) / ${steps.length})`,
                        transform: `translateX(${activeIndex * 100}%)`,
                        left: '6px' // offset for padding
                    }}
                >
                    {/* Subtle inner shine on the bubble */}
                    <div className="absolute inset-x-2 top-0 h-px bg-white/30 rounded-full" />
                </div>

                {/* Steps Layer */}
                <div className="flex w-full h-full relative z-10">
                    {steps.map((step, idx) => {
                        const isActive = idx === activeIndex;
                        const isCompleted = idx < activeIndex;
                        const isUpcoming = idx > activeIndex;

                        return (
                            <div
                                key={step.key}
                                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#8E8E93] hover:text-[#D1D1D6]'}`}
                            >
                                {/* Icon */}
                                <svg
                                    className={`w-4 h-4 sm:w-3.5 sm:h-3.5 transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'} ${isCompleted ? 'opacity-50' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={isActive ? 2.5 : 2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d={step.icon} />
                                </svg>

                                {/* Label - Hidden on Mobile */}
                                <span className={`hidden sm:block text-[10px] font-medium tracking-tight transition-all duration-300 ${isActive ? 'font-semibold' : ''}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
