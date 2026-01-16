import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Schema for Trend-to-Idea Agent
 * 
 * Two main tables:
 * 1. runs - Stores the state of each agent run
 * 2. events - Stores streaming events for real-time UI updates
 */

export default defineSchema({
    // Runs table: tracks the overall state of each agent execution
    runs: defineTable({
        // Run status tracking
        status: v.union(
            v.literal("idle"),
            v.literal("planning"),
            v.literal("researching"),
            v.literal("report_ready"),
            v.literal("awaiting_approval"),
            v.literal("ideating"),
            v.literal("done"),
            v.literal("error")
        ),

        // User input
        userQuery: v.string(),

        // Research constraints
        constraints: v.object({
            timeframe: v.optional(v.string()),
            region: v.optional(v.string()),
            include: v.optional(v.array(v.string())),
            exclude: v.optional(v.array(v.string())),
        }),

        // Research output
        researchReport: v.optional(v.object({
            trends: v.array(v.object({
                title: v.string(),
                description: v.string(),
                confidence: v.number(),
                sources: v.array(v.object({
                    url: v.string(),
                    title: v.string(),
                    snippet: v.string(),
                    publishedDate: v.optional(v.string()),
                })),
            })),
            generatedAt: v.string(),
        })),

        // HITL approval state
        approval: v.optional(v.union(
            v.literal("approved"),
            v.literal("refine"),
            v.literal("restart"),
            v.null()
        )),

        // Refinement instructions
        refinement: v.optional(v.string()),

        // Approved timestamp
        approvedAt: v.optional(v.number()),
    }),
    // Note: Convex automatically adds _creationTime to all documents

    // Events table: streaming updates for the UI
    events: defineTable({
        runId: v.id("runs"),

        // Event metadata
        ts: v.number(),
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

        // Event payload (flexible JSON structure)
        payload: v.any(),
    })
        .index("by_run_and_time", ["runId", "ts"])
        .index("by_run_and_surface", ["runId", "surface", "ts"]),

    // Search Cache table: stores search results to reduce API calls
    searchCache: defineTable({
        query: v.string(),
        normalizedQuery: v.string(),
        results: v.array(v.object({
            title: v.string(),
            url: v.string(),
            content: v.string(),
            score: v.number(),
            published_date: v.optional(v.string()),
        })),
        cachedAt: v.number(),
    })
        .index("by_query", ["normalizedQuery"]),
});
