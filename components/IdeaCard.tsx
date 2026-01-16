"use client";

interface IdeaCardProps {
    idea: {
        platform: string;
        idea: string;
        trendCitation?: {
            trendTitle: string;
            sourceUrl?: string;
        };
    };
}

function getPlatformBadge(platform: string) {
    // Return a minimal text-only badge request by "Industrial" style
    return platform.toUpperCase();
}

export function IdeaCard({ idea }: IdeaCardProps) {
    return (
        <div className="p-5 bg-[#17181D] border border-white/5 rounded hover:border-accent/30 transition-all group relative">
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-r-[8px] border-t-transparent border-r-transparent group-hover:border-r-accent transition-all" />

            {/* Platform Header */}
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <span className="font-mono text-[10px] tracking-widest text-accent uppercase">
                    {getPlatformBadge(idea.platform)}
                </span>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                </div>
            </div>

            {/* Content */}
            <div className="text-sm font-light text-white/80 leading-relaxed space-y-2">
                {idea.idea.split('\n').map((block, i) => (
                    <p key={i}>{block}</p>
                ))}
            </div>

            {/* Footer / Citation */}
            {idea.trendCitation && (
                <div className="mt-4 pt-3 border-t border-dashed border-white/10 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/30 uppercase">REF:</span>
                    <span className="text-[10px] text-white/50 truncate flex-1">
                        {idea.trendCitation.trendTitle}
                    </span>
                </div>
            )}
        </div>
    );
}
