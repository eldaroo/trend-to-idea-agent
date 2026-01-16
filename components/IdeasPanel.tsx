"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { IdeaCard } from "./IdeaCard";

interface IdeasPanelProps {
    runId: Id<"runs"> | null;
    targetCount?: number;
    isMobile?: boolean;
    onClose?: () => void;
}

export function IdeasPanel({ runId, targetCount = 5, isMobile = false, onClose }: IdeasPanelProps) {
    const events = useQuery(
        api.events.getEventsBySurface,
        runId ? { runId, surface: "sidebar" } : "skip"
    );

    const run = useQuery(api.runs.getRun, runId ? { runId } : "skip");

    const scrollRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const showSidebar = run?.status === "ideating" || run?.status === "done";
    const ideas = events?.filter((e: any) => e.type === "idea") || [];

    // Monitor scroll position
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setShouldAutoScroll(isAtBottom);
    };

    // Auto-scroll effect
    useEffect(() => {
        if (shouldAutoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [ideas, shouldAutoScroll]);

    return (
        <div className={`${isMobile ? 'w-full' : 'w-[380px]'} flex flex-col h-full border-l border-white/10 relative overflow-hidden bg-black`}>
            {/* Glass Background Layer */}
            <div className="absolute inset-0 ios-glass z-0" />

            {/* Header */}
            <div className="p-5 sm:p-6 pb-4 relative z-10 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <h2 className="text-[17px] font-semibold text-white tracking-tight">
                        Intelligence Feed
                    </h2>
                    <div className="flex items-center gap-2">
                        {showSidebar && ideas.length > 0 && (
                            <div className="px-3 py-1 rounded-full bg-[#30D158] text-white text-[12px] font-bold shadow-sm">
                                {ideas.length}
                            </div>
                        )}
                        {/* Close button for mobile */}
                        {isMobile && onClose && (
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-[13px] text-[#8E8E93] mt-1">
                    Live creative synthesis
                </p>
            </div>

            {/* Content */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-3 sm:p-4 relative z-10 space-y-3"
            >
                {!showSidebar ? (
                    // Empty State - iOS Style
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-40">
                        <div className="w-16 h-16 rounded-[20px] bg-white/10 flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡️</span>
                        </div>
                        <p className="text-[15px] font-medium text-white mb-1">
                            Awaiting Research
                        </p>
                        <p className="text-[13px] text-[#EBEBF5]">
                            Ideas will appear here once analysis is approved.
                        </p>
                    </div>
                ) : ideas.length === 0 ? (
                    // Loading State
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-6 h-6 border-[3px] border-[#0A84FF]/30 border-t-[#0A84FF] rounded-full animate-spin mb-3" />
                        <span className="text-[13px] font-medium text-[#8E8E93]">Generative Model Active...</span>
                    </div>
                ) : (
                    // Accordion Ideas list
                    <>
                        {ideas.map((event: any, idx: number) => (
                            <IdeaCard
                                key={idx}
                                idea={event.payload}
                                isExpanded={expandedIndex === idx}
                                onToggle={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                onCiteClick={(trendTitle) => {
                                    window.dispatchEvent(new CustomEvent('highlight-trend', { detail: trendTitle }));
                                    // Close panel on mobile when citing
                                    if (isMobile && onClose) onClose();
                                }}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
