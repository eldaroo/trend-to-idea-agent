"use client";

interface EventCardProps {
    event: {
        type: string;
        payload: any;
    };
}

export function EventCard({ event }: EventCardProps) {
    const { type, payload } = event;

    if (type === "status") {
        return (
            <div className="flex justify-center my-4 animate-ios-entry">
                <div className="px-4 py-1.5 rounded-full bg-[#1C1C1E] border border-white/5 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#0A84FF] animate-pulse" />
                    <span className="text-[12px] font-medium text-[#EBEBF5]/60">
                        {payload.step}
                    </span>
                </div>
            </div>
        );
    }

    if (type === "log") {
        return (
            <div className="flex items-start gap-3 py-2 px-4 animate-ios-entry group">
                {/* Time Indicator */}
                <span className="text-[11px] font-medium text-[#48484A] mt-0.5 font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Bubble */}
                <div className="flex-1 p-3 rounded-2xl rounded-tl-none bg-[#1C1C1E] text-[13px] text-[#D1D1D6] leading-relaxed shadow-sm max-w-[90%]">
                    {payload.msg}
                </div>
            </div>
        );
    }

    if (type === "finding") {
        return (
            <div className="mx-4 my-3 p-4 rounded-[20px] bg-[#1C1C1E] border border-white/5 shadow-sm animate-ios-entry">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF]">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <h4 className="font-semibold text-[15px] text-white tracking-tight flex-1 truncate">
                        {payload.trendCandidate}
                    </h4>
                </div>

                {payload.sourceRefs?.map((source: any, idx: number) => (
                    <div key={idx} className="bg-[#2C2C2E] rounded-xl p-3 mt-2">
                        <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#0A84FF] font-medium hover:underline block mb-1 truncate"
                        >
                            {new URL(source.url).hostname.replace('www.', '')} ↗
                        </a>
                        <p className="text-[13px] text-[#8E8E93] line-clamp-2 leading-snug">
                            {source.snippet}
                        </p>
                    </div>
                ))}
            </div>
        );
    }

    if (type === "error") {
        return (
            <div className="mx-4 my-2 p-4 rounded-[20px] bg-[#FF453A]/10 border border-[#FF453A]/20">
                <div className="flex gap-3">
                    <div className="text-[#FF453A]">⚠️</div>
                    <div>
                        <div className="text-[#FF453A] font-semibold text-[14px]">Analysis Error</div>
                        <div className="text-[#FF453A]/80 text-[13px] mt-1">{payload.message}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === "report") return null;

    return null;
}
