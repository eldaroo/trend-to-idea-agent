"use client";

import { Id } from "../convex/_generated/dataModel";

interface TopBarProps {
    runId: Id<"runs"> | null;
    onNewRun: () => void;
}

export function TopBar({ runId, onNewRun }: TopBarProps) {
    return (
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#0B0C10] relative z-20">
            {/* Left: Branding */}
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center bg-white/5">
                    <span className="text-accent text-lg font-bold">G</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-sm font-bold tracking-widest uppercase text-white/90">
                        Trend-to-Idea
                    </h1>
                    <span className="text-[10px] font-mono text-white/40 tracking-wider">
                        STRATEGIC INTELLIGENCE V1.0
                    </span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {runId && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/5 bg-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="font-mono text-xs text-white/60">
                            ID: {runId.slice(-8).toUpperCase()}
                        </span>
                    </div>
                )}
                <button
                    onClick={onNewRun}
                    className="flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold tracking-wide uppercase transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                >
                    <span>+</span>
                    New Session
                </button>
            </div>
        </header>
    );
}
