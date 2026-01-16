"use client";

import { useMemo } from "react";

interface IdeaCardProps {
    idea: {
        platform: string;
        idea: string;
        why?: string;
        trendCitation?: {
            trendTitle: string;
            sourceUrl?: string;
        };
    };
    isExpanded?: boolean;
    onToggle?: () => void;
    onCiteClick?: (trendTitle: string) => void;
}

// iOS System colors for platforms
function getPlatformColor(platform: string) {
    const p = platform.toLowerCase();
    if (p.includes('linkedin')) return '#0A66C2';
    if (p.includes('twitter') || p.includes('x')) return '#000000';
    if (p.includes('tiktok')) return '#FE2C55';
    if (p.includes('instagram')) return '#E4405F';
    return '#0A84FF';
}

function HighlightedText({ text }: { text: string }) {
    // Simple markdown parser for bold (**text**) and lists
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <span>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </span>
    );
}

export function IdeaCard({ idea, isExpanded = false, onToggle, onCiteClick }: IdeaCardProps) {
    const accentColor = getPlatformColor(idea.platform);

    // Extract title from first meaningful line (skip metadata like "Image:", "Caption:", etc.)
    const title = useMemo(() => {
        if (typeof idea.idea !== 'string') return "Generating idea...";
        const lines = idea.idea.split('\n').filter(line => line.trim());

        // Skip metadata lines (Image:, Caption:, CTA:, Question:)
        const contentLine = lines.find(line => {
            const upper = line.trim().toUpperCase();
            return !upper.startsWith('IMAGE:') &&
                !upper.startsWith('CAPTION:') &&
                !upper.startsWith('CTA:') &&
                !upper.startsWith('QUESTION:');
        });

        if (!contentLine) return 'Content Idea';

        // Try to extract bold text first
        const boldMatch = contentLine.match(/\*\*(.*?)\*\*/);
        if (boldMatch) return boldMatch[1];

        // Otherwise use first 60 chars of the line
        const cleaned = contentLine.replace(/^[#-]\s*/, '').trim();
        return cleaned.length > 60 ? cleaned.substring(0, 60) + '...' : cleaned;
    }, [idea.idea]);

    return (
        <div
            onClick={onToggle}
            className={`
                group relative overflow-hidden cursor-pointer
                px-4 py-3 rounded-[16px] border backdrop-blur-md
                transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                ${isExpanded
                    ? 'bg-[#2C2C2E] border-white/20 shadow-xl z-10'
                    : 'bg-[#1C1C1E]/60 border-white/5 hover:bg-[#2C2C2E]/80'
                }
            `}
        >
            {/* Header / Summary Line */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Platform Dot */}
                    <div
                        className={`w-2 h-2 rounded-full shadow-[0_0_8px_current] shrink-0 transition-all duration-300 ${isExpanded ? 'scale-125' : ''}`}
                        style={{ backgroundColor: accentColor, color: accentColor }}
                    />

                    {/* Platform Badge */}
                    <div className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider shrink-0 bg-[#0A84FF]/15 text-[#0A84FF]">
                        {idea.platform.toUpperCase()}
                    </div>

                    {/* Title (Always visible, but styled differently) */}
                    <h3 className={`font-semibold tracking-tight truncate transition-all duration-300 ${isExpanded ? 'text-[16px] text-white' : 'text-[13px] text-white/90'}`}>
                        {title}
                    </h3>
                </div>

                {/* Chevron */}
                <div className={`text-[#8E8E93] transition-transform duration-500 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>
            </div>

            {/* Expanded Content */}
            <div
                className={`
                    grid transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden
                    ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}
                `}
            >
                <div className="min-h-0">
                    {/* Why - Strategic Rationale */}
                    {idea.why && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-[#0A84FF]/10 border-l-2 border-[#0A84FF]">
                            <p className="text-[13px] text-[#0A84FF] font-medium italic">
                                💡 {idea.why}
                            </p>
                        </div>
                    )}

                    {/* Rich Text Body */}
                    <div className="space-y-3 text-[14px] text-[#EBEBF5]/90 leading-relaxed font-normal">
                        {idea.idea.split('\n').map((block, i) => {
                            // Section styling for "Image", "Caption", etc.
                            if (block.toUpperCase().startsWith('IMAGE:') || block.toUpperCase().startsWith('CAPTION:') || block.toUpperCase().startsWith('QUESTION:')) {
                                return (
                                    <div key={i} className="text-[12px] text-[#8E8E93] font-medium bg-white/5 p-2 rounded-lg border border-white/5">
                                        <HighlightedText text={block} />
                                    </div>
                                );
                            }
                            // Bullet points
                            if (block.trim().startsWith('- ')) {
                                return (
                                    <div key={i} className="flex gap-2 pl-1">
                                        <span className="text-[#0A84FF]">•</span>
                                        <span><HighlightedText text={block.substring(2)} /></span>
                                    </div>
                                );
                            }
                            // Normal paragraphs
                            if (!block.trim()) return null;
                            return <p key={i}><HighlightedText text={block} /></p>;
                        })}
                    </div>

                    {/* Context Pills */}
                    {idea.trendCitation && (
                        <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCiteClick?.(idea.trendCitation!.trendTitle);
                                }}
                                className="group/pill flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] text-[11px] font-medium hover:bg-[#0A84FF]/20 active:scale-95 transition-all"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                </svg>
                                <span className="truncate max-w-[200px]">{idea.trendCitation.trendTitle}</span>
                                <span className="opacity-0 group-hover/pill:opacity-100 transition-opacity">→</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
