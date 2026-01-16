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
            {/* iOS Floating Island Style - High Opacity Fix */}
            <div className="w-full max-w-[600px] mx-auto rounded-[32px] bg-[#1C1C1E]/98 backdrop-blur-3xl border border-white/10 p-2 pl-6 flex items-center justify-between shadow-[0_8px_40px_rgba(0,0,0,0.6)] relative animate-ios-entry text-[#EBEBF5] z-50">

                {/* Left: Indicator */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#30D158]/20 flex items-center justify-center text-[#30D158]">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-[15px] font-semibold text-white leading-tight">
                            Approval Required
                        </div>
                        <div className="text-[12px] text-[#8E8E93]">
                            Ready to generate ideas?
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowRefineModal(true)}
                        disabled={isLoading}
                        className="px-5 py-3 rounded-full text-[15px] font-medium text-[#0A84FF] hover:bg-white/5 transition-colors"
                    >
                        Refine
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-full bg-[#0A84FF] hover:bg-[#0071E3] active:scale-95 transition-all text-white font-semibold text-[15px] shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <span className="opacity-80">Processing...</span>
                        ) : (
                            "Generate"
                        )}
                    </button>
                </div>

                {/* Restart X (Small absolute) */}
                <button
                    onClick={handleRestart}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#2C2C2E] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors shadow-lg"
                    title="Restart"
                >
                    ✕
                </button>
            </div>

            <RefineModal
                isOpen={showRefineModal}
                onClose={() => setShowRefineModal(false)}
                onSubmit={handleRefine}
            />
        </>
    );
}
