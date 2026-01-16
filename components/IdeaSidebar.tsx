"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";

interface IdeaSidebarProps {
    runId: Id<"runs"> | null;
}

export function IdeaSidebar({ runId }: IdeaSidebarProps) {
    const events = useQuery(
        api.events.getEventsBySurface,
        runId ? { runId, surface: "sidebar" } : "skip"
    );

    const run = useQuery(api.runs.getRun, runId ? { runId } : "skip");

    const showSidebar = run?.status === "ideating" || run?.status === "done";

    if (!runId || !showSidebar) {
        return null;
    }

    return (
        <div className="w-96 border-l border-gray-200 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    💡 Content Ideas
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                    Platform-specific ideas based on approved trends
                </p>

                <div className="space-y-4">
                    {events?.map((event, idx) => {
                        if (event.type === "status") {
                            return (
                                <div key={idx} className="flex items-center gap-2 text-sm text-indigo-600">
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                                    <span>{event.payload.step}</span>
                                </div>
                            );
                        }

                        if (event.type === "idea") {
                            return (
                                <div
                                    key={idx}
                                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">{getPlatformIcon(event.payload.platform)}</span>
                                        <span className="font-bold text-gray-900">{event.payload.platform}</span>
                                    </div>
                                    <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                strong: ({ children }) => (
                                                    <strong className="font-bold text-indigo-700">{children}</strong>
                                                ),
                                                em: ({ children }) => (
                                                    <em className="italic text-gray-600">{children}</em>
                                                ),
                                                p: ({ children }) => (
                                                    <p className="mb-2 last:mb-0">{children}</p>
                                                ),
                                            }}
                                        >
                                            {event.payload.idea}
                                        </ReactMarkdown>
                                    </div>
                                    {event.payload.trendCitation && (
                                        <div className="mt-3 pt-2 border-t border-gray-100">
                                            <span className="text-xs text-gray-500">
                                                📊 Based on: {event.payload.trendCitation.trendTitle}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        if (event.type === "error") {
                            return (
                                <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="text-sm text-red-700">{event.payload.message}</div>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}

function getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
        "Twitter/X": "𝕏",
        Twitter: "🐦",
        LinkedIn: "💼",
        "Blog Post": "📝",
        Blog: "📝",
        YouTube: "🎥",
        Instagram: "📸",
        TikTok: "🎵",
    };
    return icons[platform] || "💡";
}
