"use client";

import { useState } from "react";

interface RefineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        timeframe: string;
        region: string;
        include: string;
        platforms: string[];
        ideaCount: number;
    }) => void;
}

export function RefineModal({ isOpen, onClose, onSubmit }: RefineModalProps) {
    const [timeframe, setTimeframe] = useState("7d");
    const [region, setRegion] = useState("Global");
    const [include, setInclude] = useState("");
    const [platforms, setPlatforms] = useState<string[]>(["LinkedIn", "Twitter/X"]);
    const [ideaCount, setIdeaCount] = useState(5);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit({ timeframe, region, include, platforms, ideaCount });
        onClose();
    };

    const togglePlatform = (platform: string) => {
        setPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
            <div className="w-full max-w-md p-6 rounded-[24px] animate-ios-entry shadow-2xl"
                style={{
                    background: '#1C1C1E',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                        Refine Research
                    </h3>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-[#2C2C2E] text-[#8E8E93] hover:text-white">
                        ✕
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Timeframe */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#8E8E93]">
                            Timeframe
                        </label>
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#2C2C2E] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                        >
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                        </select>
                    </div>

                    {/* Region */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#8E8E93]">
                            Region
                        </label>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#2C2C2E] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                        >
                            <option value="Global">Global</option>
                            <option value="US">United States</option>
                            <option value="Europe">Europe</option>
                            <option value="Asia">Asia</option>
                            <option value="Latin America">Latin America</option>
                        </select>
                    </div>

                    {/* Include topics */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#8E8E93]">
                            Include topics
                        </label>
                        <input
                            type="text"
                            value={include}
                            onChange={(e) => setInclude(e.target.value)}
                            placeholder="e.g., AI, startups, technology"
                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#2C2C2E] border border-white/10 text-white placeholder-[#48484A] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                        />
                    </div>

                    {/* Platforms */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#8E8E93]">
                            Output Platforms
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['LinkedIn', 'Twitter/X', 'Instagram', 'TikTok', 'Blog Post', 'Facebook'].map(platform => (
                                <button
                                    key={platform}
                                    type="button"
                                    onClick={() => togglePlatform(platform)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${platforms.includes(platform)
                                            ? 'bg-[#0A84FF] text-white'
                                            : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white border border-white/10'
                                        }`}
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Idea Count */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#8E8E93]">
                            Number of Ideas
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={ideaCount}
                            onChange={(e) => setIdeaCount(parseInt(e.target.value) || 5)}
                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#2C2C2E] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button onClick={handleSubmit}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#0A84FF] hover:bg-[#0071E3] text-white transition-colors">
                        Apply & Re-search
                    </button>
                    <button onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#2C2C2E] text-[#8E8E93] hover:text-white border border-white/10 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
