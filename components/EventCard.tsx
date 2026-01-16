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
            <div className="flex items-center gap-3 py-2 px-4 animate-fade-in font-mono text-xs">
                <span className="text-accent">&gt;&gt;</span>
                <span className="text-white/60 uppercase tracking-wider">
                    {payload.step}
                </span>
                <span className="w-1.5 h-4 bg-accent/50 animate-pulse ml-1" />
            </div>
        );
    }

    if (type === "log") {
        return (
            <div className="flex items-start gap-4 py-1.5 px-4 animate-fade-in font-mono text-[11px] opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-white/20 min-w-[20px]">{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <span className="text-white/80">
                    {payload.msg}
                </span>
            </div>
        );
    }

    if (type === "finding") {
        return (
            <div className="mx-4 my-2 p-4 rounded bg-[#15161A] border border-white/5 border-l-2 border-l-accent/50 animate-fade-in transition-all hover:bg-[#1A1C21]">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-white/90 mb-2 truncate">
                            {payload.trendCandidate}
                        </h4>
                        {payload.sourceRefs?.map((source: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-1 mt-2 pl-3 border-l border-white/10">
                                <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-accent hover:text-accent-hover truncate font-mono"
                                >
                                    LINK_REF: {new URL(source.url).hostname.replace('www.', '')}
                                </a>
                                <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                                    {source.snippet}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (type === "error") {
        return (
            <div className="mx-4 my-2 p-3 rounded bg-error/5 border border-error/20 text-error-text font-mono text-xs">
                <div className="flex gap-2">
                    <span className="font-bold">ERR::</span>
                    <span>{payload.message || 'SYSTEM_FAILURE'}</span>
                </div>
                {payload.detail && (
                    <div className="mt-1 pl-8 opacity-70">
                        {payload.detail}
                    </div>
                )}
            </div>
        );
    }

    // Skip report - handled exclusively by ReportView
    if (type === "report") return null;

    return null;
}
