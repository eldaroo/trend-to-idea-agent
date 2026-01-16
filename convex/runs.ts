import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mutations and queries for managing agent runs
 */

// Create a new run
export const createRun = mutation({
    args: {
        userQuery: v.string(),
        constraints: v.object({
            timeframe: v.optional(v.string()),
            region: v.optional(v.string()),
            include: v.optional(v.array(v.string())),
            exclude: v.optional(v.array(v.string())),
        }),
    },
    handler: async (ctx, args) => {
        // Note: Convex automatically adds _creationTime
        const runId = await ctx.db.insert("runs", {
            status: "idle",
            userQuery: args.userQuery,
            constraints: args.constraints,
        });
        return runId;
    },
});

// Update run status
export const updateRunStatus = mutation({
    args: {
        runId: v.id("runs"),
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
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.runId, { status: args.status });
    },
});

// Set research report
export const setResearchReport = mutation({
    args: {
        runId: v.id("runs"),
        report: v.object({
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
        }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.runId, {
            researchReport: args.report,
            status: "report_ready",
        });
    },
});

// Set approval decision
export const setApproval = mutation({
    args: {
        runId: v.id("runs"),
        approval: v.union(
            v.literal("approved"),
            v.literal("refine"),
            v.literal("restart"),
            v.null()
        ),
        refinement: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const updates: any = {
            approval: args.approval,
            approvedAt: Date.now(),
        };

        if (args.refinement) {
            updates.refinement = args.refinement;
        }

        await ctx.db.patch(args.runId, updates);
    },
});

// Update constraints (for refine flow)
export const updateConstraints = mutation({
    args: {
        runId: v.id("runs"),
        constraints: v.object({
            timeframe: v.optional(v.string()),
            region: v.optional(v.string()),
            include: v.optional(v.array(v.string())),
            exclude: v.optional(v.array(v.string())),
            platforms: v.optional(v.array(v.string())),
            ideaCount: v.optional(v.number()),
        }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.runId, { constraints: args.constraints });
    },
});

// Get a single run
export const getRun = query({
    args: { runId: v.id("runs") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.runId);
    },
});

// List recent runs
export const listRuns = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("runs")
            .order("desc")
            .take(20);
    },
});
