"use client";

interface Trend {
    title: string;
    description: string;
    confidence: number;
    sources: Array<{
        url: string;
        title: string;
        snippet: string;
        publishedDate?: string;
    }>;
}

interface ReportViewProps {
    report: {
        trends: Trend[];
        generatedAt: string;
    };
}

function getConfidenceStyle(confidence: number) {
    if (confidence >= 0.8) return { label: 'HIGH CONFIDENCE', color: 'text-success-text', border: 'border-success/30', bg: 'bg-success/10' };
    if (confidence >= 0.5) return { label: 'MED CONFIDENCE', color: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' };
    return { label: 'LOW CONFIDENCE', color: 'text-white/40', border: 'border-white/10', bg: 'bg-white/5' };
}

export function ReportView({ report }: ReportViewProps) {
    return (
        <div className="animate-fade-in px-4 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <h2 className="font-mono text-sm tracking-widest text-white/90 uppercase">
                        Synthesis Report
                    </h2>
                </div>
                <span className="font-mono text-[10px] text-white/30">
                    ts: {new Date(report.generatedAt).getTime()}
                </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-4">
                {report.trends.map((trend, idx) => {
                    const conf = getConfidenceStyle(trend.confidence);

                    return (
                        <div key={idx}
                            className="bg-[#15161A] border border-white/5 rounded-lg p-5 hover:border-white/10 transition-colors group relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-white/5 group-hover:bg-accent/50 transition-colors" />

                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 mb-3 pl-2">
                                <h3 className="font-sans font-semibold text-white text-base">
                                    {idx + 1}. {trend.title}
                                </h3>
                                <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${conf.border} ${conf.bg} ${conf.color}`}>
                                    {conf.label}
                                </span>
                            </div>

                            {/* Body */}
                            <p className="pl-2 text-sm text-white/60 mb-4 leading-relaxed max-w-3xl font-light">
                                {trend.description}
                            </p>

                            {/* Footage/Sources */}
                            <div className="pl-2 flex flex-wrap gap-2">
                                {trend.sources.map((source, sidx) => (
                                    <a
                                        key={sidx}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded border border-white/5 hover:border-accent/30 hover:text-accent transition-all"
                                    >
                                        [{sidx + 1}] {new URL(source.url).hostname.replace('www.', '')}
                                    </a>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
