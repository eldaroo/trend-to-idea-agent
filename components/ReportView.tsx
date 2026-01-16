"use client";

import { useEffect, useRef, useState } from "react";

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

function getConfidenceBadge(confidence: number) {
    if (confidence >= 0.8) return { label: 'High Confidence', bg: 'bg-[#30D158]/10', color: 'text-[#30D158]' };
    if (confidence >= 0.5) return { label: 'Medium Confidence', bg: 'bg-[#FF9F0A]/10', color: 'text-[#FF9F0A]' };
    return { label: 'Low Confidence', bg: 'bg-[#8E8E93]/10', color: 'text-[#8E8E93]' };
}

export function ReportView({ report }: ReportViewProps) {
    const [highlightTitle, setHighlightTitle] = useState<string | null>(null);
    const trendRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        const handleHighlight = (e: CustomEvent<string>) => {
            const title = e.detail;
            setHighlightTitle(title);

            // Scroll to element
            const element = trendRefs.current[title];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Remove highlight after 2s
            setTimeout(() => setHighlightTitle(null), 3000);
        };

        window.addEventListener('highlight-trend' as any, handleHighlight);
        return () => window.removeEventListener('highlight-trend' as any, handleHighlight);
    }, []);

    return (
        <div className="px-4 pb-8 animate-ios-entry">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-[20px] font-bold tracking-tight text-white">
                    Research Synthesis
                </h2>
                <span className="text-[13px] text-[#8E8E93] bg-[#1C1C1E] px-3 py-1 rounded-full">
                    {new Date(report.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* Grid */}
            <div className="flex flex-col gap-4">
                {report.trends.map((trend, idx) => {
                    const conf = getConfidenceBadge(trend.confidence);
                    const isHighlighted = highlightTitle === trend.title;

                    return (
                        <div key={idx}
                            ref={(el) => { trendRefs.current[trend.title] = el; }}
                            className={`
                                rounded-[24px] p-6 border transition-all duration-500
                                ${isHighlighted
                                    ? 'bg-[#0A84FF]/20 border-[#0A84FF] shadow-[0_0_30px_rgba(10,132,255,0.3)] scale-[1.02]'
                                    : 'bg-[#1C1C1E] border-white/5 hover:bg-[#2C2C2E]'
                                }
                            `}
                        >
                            {/* Header */}
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                <h3 className="text-[17px] font-semibold text-white leading-tight">
                                    {trend.title}
                                </h3>
                                <span className={`text-[12px] font-medium px-3 py-1 rounded-full ${conf.bg} ${conf.color}`}>
                                    {conf.label}
                                </span>
                            </div>

                            {/* Body */}
                            <p className="text-[15px] text-[#D1D1D6] leading-relaxed mb-5 font-normal">
                                {trend.description}
                            </p>

                            {/* Data/Sources */}
                            <div>
                                <h4 className="text-[12px] font-semibold text-[#8E8E93] uppercase mb-2 tracking-wide">Sources</h4>
                                <div className="flex flex-wrap gap-2">
                                    {trend.sources.map((source, sidx) => (
                                        <a
                                            key={sidx}
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[12px] text-[#0A84FF] bg-[#0A84FF]/10 px-3 py-1.5 rounded-lg font-medium hover:bg-[#0A84FF]/20 transition-colors truncate max-w-[200px]"
                                        >
                                            {new URL(source.url).hostname.replace('www.', '')}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
