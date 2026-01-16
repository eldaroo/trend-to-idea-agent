"use client";

import { Id } from "../convex/_generated/dataModel";

interface TopBarProps {
    runId: Id<"runs"> | null;
    onNewRun: () => void;
}

export function TopBar({ runId, onNewRun }: TopBarProps) {
    return (
        <header className="h-[60px] flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-200"
            style={{
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>

            {/* Left: Brand / Title */}
            <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-semibold tracking-tight">
                    Trend-to-Idea
                </h1>
                {runId && (
                    <span className="text-[13px] text-[#8E8E93] font-medium px-2 py-0.5 rounded-md bg-[#1C1C1E]">
                        #{runId.slice(-4).toUpperCase()}
                    </span>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center">
                {/* Actions removed */}
            </div>
        </header>
    );
}
