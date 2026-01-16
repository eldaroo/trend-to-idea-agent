"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { EventCard } from "./EventCard";
import { ReportView } from "./ReportView";

interface EventFeedProps {
    runId: Id<"runs"> | null;
}

export function EventFeed({ runId }: EventFeedProps) {
    const events = useQuery(
        api.events.getEventsBySurface,
        runId ? { runId, surface: "main" } : "skip"
    );

    if (!runId) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'var(--bg-elevated)' }}>
                        <span className="text-2xl">🔍</span>
                    </div>
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Ready to explore
                    </h3>
                    <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
                        Enter a query below to discover trending topics and generate content ideas
                    </p>
                </div>
            </div>
        );
    }

    // Find the report event if exists
    const reportEvent = events?.find((e: any) => e.type === "report");
    const nonReportEvents = events?.filter((e: any) => e.type !== "report") || [];

    return (
        <div className="flex-1 overflow-y-auto p-6">
            {/* Event stream */}
            <div className="space-y-1">
                {nonReportEvents.map((event: any, idx: number) => (
                    <EventCard key={idx} event={event} />
                ))}
            </div>

            {/* Report section */}
            {reportEvent && (
                <div className="mt-6">
                    <ReportView report={reportEvent.payload.report} />
                </div>
            )}
        </div>
    );
}
