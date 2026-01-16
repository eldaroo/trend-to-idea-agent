"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { RefineModal } from "./RefineModal";

interface HitlBarProps {
    runId: Id<"runs">;
    onApprove: () => void;
}

export function HitlBar({ runId, onApprove }: HitlBarProps) {
    const [showRefineModal, setShowRefineModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const setApproval = useMutation(api.runs.setApproval);
    const updateConstraints = useMutation(api.runs.updateConstraints);

    const handleApprove = async () => {
        setIsLoading(true);
        await setApproval({ runId, approval: "approved" });
        onApprove();
        setIsLoading(false);
    };

    const handleRefine = async (data: {
        timeframe: string;
        region: string;
        include: string;
        exclude: string;
    }) => {
        setIsLoading(true);
        await updateConstraints({
            runId,
            constraints: {
                timeframe: data.timeframe,
                region: data.region,
                include: data.include ? data.include.split(',').map(s => s.trim()) : undefined,
                exclude: data.exclude ? data.exclude.split(',').map(s => s.trim()) : undefined,
            },
        });
        await setApproval({ runId, approval: "refine", refinement: "User refined constraints" });
        onApprove();
        setIsLoading(false);
    };

    const handleRestart = async () => {
        setIsLoading(true);
        await setApproval({ runId, approval: "restart" });
        onApprove();
        setIsLoading(false);
    };

    return (
        <>
            <div className="w-full max-w-4xl mx-auto rounded-lg bg-[#15161A] border-l-4 border-l-accent border-y border-r border-y-white/10 border-r-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-5 flex items-center justify-between relative group overflow-hidden">
                {/* subtle scanline effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 opacity-20 pointer-events-none bg-[length:100%_2px,3px_100%]" />

                {/* Left: Info */}
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded flex items-center justify-center bg-accent/10 border border-accent/20">
                        <span className="text-xl animate-pulse">⚡</span>
                    </div>
                    <div>
                        <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest leading-none mb-1">
                            AWAITING COMMAND
                        </h4>
                        <p className="text-[10px] text-white/50 font-mono">
                            READY TO GENERATE STRATEGIC CONTENT
                        </p>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={handleRestart}
                        disabled={isLoading}
                        className="group flex flex-col items-center justify-center px-4 py-2 rounded transition-all text-white/30 hover:text-error hover:bg-error/5 disabled:opacity-50"
                    >
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider group-hover:scale-110 transition-transform">Restart</span>
                    </button>

                    <div className="h-8 w-px bg-white/5" />

                    <button
                        onClick={() => setShowRefineModal(true)}
                        disabled={isLoading}
                        className="group flex flex-col items-center justify-center px-4 py-2 rounded transition-all text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-50"
                    >
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider group-hover:underline decoration-accent/50 underline-offset-4">Refine Scope</span>
                    </button>

                    <button
                        onClick={handleApprove}
                        disabled={isLoading}
                        className="relative overflow-hidden px-8 py-3 rounded bg-accent hover:bg-white hover:text-accent transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(102,252,241,0.2)]"
                    >
                        {/* Button Shine Effect */}
                        <div className="absolute top-0 -left-[100%] w-full h-full bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-[20deg] group-hover:animate-[shine_1s_ease-in-out_infinite]" />

                        <div className="flex items-center gap-2 relative z-10">
                            {isLoading ? (
                                <span className="font-mono font-bold text-xs uppercase text-black tracking-widest animate-pulse">PROCESSING...</span>
                            ) : (
                                <>
                                    <span className="text-black font-bold">▶</span>
                                    <span className="font-mono font-black text-xs uppercase text-black tracking-[0.2em] group-hover:text-black">EXECUTE</span>
                                </>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            <RefineModal
                isOpen={showRefineModal}
                onClose={() => setShowRefineModal(false)}
                onSubmit={handleRefine}
            />
        </>
    );
}
