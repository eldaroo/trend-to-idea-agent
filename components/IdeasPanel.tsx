"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { IdeaCard } from "./IdeaCard";

interface IdeasPanelProps {
    runId: Id<"runs"> | null;
    targetCount?: number;
}

export function IdeasPanel({ runId, targetCount = 5 }: IdeasPanelProps) {
    const events = useQuery(
        api.events.getEventsBySurface,
        runId ? { runId, surface: "sidebar" } : "skip"
    );

    const run = useQuery(api.runs.getRun, runId ? { runId } : "skip");

    const showSidebar = run?.status === "ideating" || run?.status === "done";
    const ideas = events?.filter((e: any) => e.type === "idea") || [];
    const statusEvent = events?.find((e: any) => e.type === "status");

    return (
        <div className="w-[420px] flex flex-col border-l border-white/5 bg-[#0F1115]">
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-[#0B0C10]">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <h2 className="font-mono text-sm tracking-widest text-white/90 uppercase">
                            Intelligence Feed
                        </h2>
                    </div>
                    {showSidebar && ideas.length > 0 && (
                        <span className="font-mono text-xs text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                            {String(ideas.length).padStart(2, '0')}/{String(targetCount).padStart(2, '0')}
                        </span>
                    )}
                </div>
                {/* Secondary Status Line */}
                <div className="h-4 pl-5">
                    {statusEvent && showSidebar && (
                        <span className="text-xs font-mono text-white/40 animate-pulse">
                            {`>> ${statusEvent.payload?.step}...`}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                />

                {!showSidebar ? (
                    // Minimal Wireframe Placeholder
                    <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                        {/* Abstract Tech Graphic */}
                        <div className="w-32 h-32 border border-white/5 rounded-full flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 border border-white/5 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                            <div className="w-24 h-24 border border-white/10 rounded-full flex items-center justify-center">
                                <span className="font-mono text-2xl text-white/10">WAIT</span>
                            </div>
                        </div>
                        <p className="font-mono text-xs text-white/30 tracking-widest uppercase">
                            Awaiting Research Approval
                        </p>
                    </div>
                ) : ideas.length === 0 ? (
                    // Loading state
                    <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                        <div className="flex gap-1 mb-4">
                            <div className="w-1 h-8 bg-accent animate-[height_1s_ease-in-out_infinite]" />
                            <div className="w-1 h-8 bg-accent animate-[height_1s_ease-in-out_0.2s_infinite]" />
                            <div className="w-1 h-8 bg-accent animate-[height_1s_ease-in-out_0.4s_infinite]" />
                        </div>
                        <p className="font-mono text-xs text-accent animate-pulse tracking-widest">
                            PROCESSING_INTELLIGENCE
                        </p>
                    </div>
                ) : (
                    // Ideas list
                    <div className="space-y-4 relative z-10">
                        {ideas.map((event: any, idx: number) => (
                            <IdeaCard key={idx} idea={event.payload} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
