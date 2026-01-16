import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Simplified Orchestrator (Convex-compatible)
 * 
 * Note: LangGraph runs in Next.js API route instead of Convex action
 * to avoid edge runtime compatibility issues
 */

export const runOrchestrator = action({
    args: {
        runId: v.id("runs"),
    },
    handler: async (ctx, args) => {
        await ctx.runMutation(api.runs.updateRunStatus, {
            runId: args.runId,
            status: "planning",
        });

        return { success: true, message: "Orchestrator triggered" };
    },
});

export const resumeAfterApproval = action({
    args: {
        runId: v.id("runs"),
    },
    handler: async (ctx, args) => {
        await ctx.runMutation(api.runs.updateRunStatus, {
            runId: args.runId,
            status: "ideating",
        });

        return { success: true, message: "Resumed after approval" };
    },
});
