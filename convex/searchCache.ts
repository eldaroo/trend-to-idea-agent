import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Search Cache Schema
 * Stores search results to avoid redundant API calls
 * TTL: 1 hour
 */

export const cacheSearch = mutation({
    args: {
        query: v.string(),
        results: v.array(v.object({
            title: v.string(),
            url: v.string(),
            content: v.string(),
            score: v.number(),
            published_date: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const normalizedQuery = args.query.toLowerCase().trim();

        // Check if cache entry exists
        const existing = await ctx.db
            .query("searchCache")
            .withIndex("by_query", (q) => q.eq("normalizedQuery", normalizedQuery))
            .first();

        if (existing) {
            // Update existing cache
            await ctx.db.patch(existing._id, {
                results: args.results,
                cachedAt: Date.now(),
            });
            return existing._id;
        }

        // Create new cache entry
        return await ctx.db.insert("searchCache", {
            query: args.query,
            normalizedQuery,
            results: args.results,
            cachedAt: Date.now(),
        });
    },
});

export const getCachedSearch = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        const normalizedQuery = args.query.toLowerCase().trim();

        const cached = await ctx.db
            .query("searchCache")
            .withIndex("by_query", (q) => q.eq("normalizedQuery", normalizedQuery))
            .first();

        if (!cached) return null;

        // Check if cache is still valid (1 hour TTL)
        const ONE_HOUR = 60 * 60 * 1000;
        const isExpired = Date.now() - cached.cachedAt > ONE_HOUR;

        if (isExpired) {
            return null; // Cache expired, will be cleaned up by clearExpiredCache
        }

        return cached.results;
    },
});

export const clearExpiredCache = mutation({
    args: {},
    handler: async (ctx) => {
        const ONE_HOUR = 60 * 60 * 1000;
        const allCached = await ctx.db.query("searchCache").collect();

        let deletedCount = 0;
        for (const entry of allCached) {
            if (Date.now() - entry.cachedAt > ONE_HOUR) {
                await ctx.db.delete(entry._id);
                deletedCount++;
            }
        }

        return { deletedCount };
    },
});
