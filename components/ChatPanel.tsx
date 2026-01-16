"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface ChatPanelProps {
    runId: Id<"runs"> | null;
}

export function ChatPanel({ runId }: ChatPanelProps) {
    const events = useQuery(
        api.events.getEventsBySurface,
        runId ? { runId, surface: "main" } : "skip"
    );

    if (!runId) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Enter a query to start researching trends
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {events?.map((event, idx) => (
                <EventCard key={idx} event={event} />
            ))}
        </div>
    );
}

function EventCard({ event }: { event: any }) {
    const { type, payload } = event;

    if (type === "status") {
        return (
            <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="font-medium">{payload.step}</span>
            </div>
        );
    }

    if (type === "log") {
        return (
            <div className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                {payload.msg}
            </div>
        );
    }

    if (type === "finding") {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="font-semibold text-purple-900 mb-2">
                    📊 Trend Candidate: {payload.trendCandidate}
                </div>
                {payload.sourceRefs?.map((source: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-700 mt-2">
                        <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            {source.title}
                        </a>
                        <p className="text-gray-600 mt-1">{source.snippet}</p>
                    </div>
                ))}
            </div>
        );
    }

    if (type === "report") {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-indigo-300 shadow-lg">
                <h3 className="text-2xl font-bold text-indigo-900 mb-4">
                    📈 Research Report
                </h3>
                <div className="space-y-4">
                    {payload.report.trends.map((trend: any, idx: number) => (
                        <div
                            key={idx}
                            className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-bold text-lg text-gray-900">{trend.title}</h4>
                                <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                                    {Math.round(trend.confidence * 100)}% confidence
                                </span>
                            </div>
                            <p className="text-gray-700 mb-3">{trend.description}</p>
                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-gray-500 uppercase">
                                    Sources:
                                </div>
                                {trend.sources.map((source: any, sidx: number) => (
                                    <div key={sidx} className="text-sm">
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {source.title}
                                        </a>
                                        {source.publishedDate && (
                                            <span className="text-gray-500 ml-2">
                                                • {new Date(source.publishedDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === "error") {
        return (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <div className="font-semibold text-red-900">❌ Error</div>
                <div className="text-sm text-red-700 mt-1">{payload.message}</div>
                {payload.detail && (
                    <div className="text-xs text-red-600 mt-2 font-mono">
                        {payload.detail}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
