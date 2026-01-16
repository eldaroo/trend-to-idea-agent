import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mutations and queries for managing streaming events
 */

// Add a new event
export const addEvent = mutation({
    args: {
        runId: v.id("runs"),
        surface: v.union(v.literal("main"), v.literal("sidebar")),
        type: v.union(
            v.literal("status"),
            v.literal("log"),
            v.literal("finding"),
            v.literal("report"),
            v.literal("error"),
            v.literal("idea"),
            v.literal("scope")
        ),
        payload: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("events", {
            runId: args.runId,
            ts: Date.now(),
            surface: args.surface,
            type: args.type,
            payload: args.payload,
        });
    },
});

// Get all events for a run
export const getEvents = query({
    args: {
        runId: v.id("runs"),
        surface: v.optional(v.union(v.literal("main"), v.literal("sidebar"))),
    },
    handler: async (ctx, args) => {
        let eventsQuery = ctx.db
            .query("events")
            .withIndex("by_run_and_time", (q) => q.eq("runId", args.runId))
            .order("asc");

        const events = await eventsQuery.collect();

        // Filter by surface if specified
        if (args.surface) {
            return events.filter((e) => e.surface === args.surface);
        }

        return events;
    },
});

// Get events by surface (for separate UI panels)
export const getEventsBySurface = query({
    args: {
        runId: v.id("runs"),
        surface: v.union(v.literal("main"), v.literal("sidebar")),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("events")
            .withIndex("by_run_and_surface", (q) =>
                q.eq("runId", args.runId).eq("surface", args.surface)
            )
            .order("asc")
            .collect();
    },
});

// Clear all events for a run (used when refining research)
export const clearEvents = mutation({
    args: {
        runId: v.id("runs"),
    },
    handler: async (ctx, args) => {
        const events = await ctx.db
            .query("events")
            .withIndex("by_run_and_time", (q) => q.eq("runId", args.runId))
            .collect();

        for (const event of events) {
            await ctx.db.delete(event._id);
        }

        console.log(`[ClearEvents] Deleted ${events.length} events for run ${args.runId}`);
        return { deleted: events.length };
    },
});
