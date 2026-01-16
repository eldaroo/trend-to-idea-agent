import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { SearchClient, getGeminiModel } from "../../../lib/research/search";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface RequestBody {
    runId: string;
}

export async function POST(request: Request) {
    try {
        const { runId } = (await request.json()) as RequestBody;
        console.log("[Orchestrator] Starting run:", runId);

        // Get the run
        const run = await convex.query(api.runs.getRun, { runId: runId as Id<"runs"> });
        if (!run) {
            return NextResponse.json({ error: "Run not found" }, { status: 404 });
        }

        // Helper to emit events
        const emit = async (surface: "main" | "sidebar", type: string, payload: any) => {
            await convex.mutation(api.events.addEvent, {
                runId: runId as Id<"runs">,
                surface,
                type: type as any,
                payload,
            });
        };

        const updateStatus = async (status: string) => {
            await convex.mutation(api.runs.updateRunStatus, {
                runId: runId as Id<"runs">,
                status: status as any,
            });
        };

        const getCachedSearch = async (query: string) => {
            return await convex.query(api.searchCache.getCachedSearch, { query });
        };

        const cacheSearch = async (query: string, results: any[]) => {
            await convex.mutation(api.searchCache.cacheSearch, { query, results });
        };

        // Check if this is a refine operation (re-running after user refined constraints)
        const isRefine = run.approval === "refine";
        let currentRun = run;

        if (isRefine) {
            console.log("[Orchestrator] Refine detected - clearing previous events");
            await convex.mutation(api.events.clearEvents, { runId: runId as Id<"runs"> });
            // Reset approval state
            await convex.mutation(api.runs.setApproval, { runId: runId as Id<"runs">, approval: null });

            // Re-fetch the run to get updated constraints from the refine form
            const updatedRun = await convex.query(api.runs.getRun, { runId: runId as Id<"runs"> });
            if (updatedRun) {
                currentRun = updatedRun;
                console.log("[Orchestrator] Using refined constraints:", currentRun.constraints);
            }
        }

        // ========== STEP 1: Clarify Scope ==========
        console.log("[Orchestrator] Clarifying scope...");
        await updateStatus("planning");
        await emit("main", "status", { step: "🎯 Analyzing your request..." });

        const model = getGeminiModel();

        // First, extract scope from user query
        const scopePrompt = `Analyze this user request and extract structured parameters:
"${run.userQuery}"

IMPORTANT: Extract EXACTLY what the user specified. Pay close attention to:

1. TARGET PLATFORMS - Look for specific platform mentions:
   - "LinkedIn" → ["LinkedIn"]
   - "Twitter" or "X" → ["Twitter/X"]
   - "Facebook" → ["Facebook"]
   - "Instagram" or "IG" → ["Instagram"]
   - "TikTok" → ["TikTok"]
   - "YouTube" or "YT" → ["YouTube"]
   - "LinkedIn + X" or "LinkedIn and Twitter" → ["LinkedIn", "Twitter/X"]
   - If no platforms mentioned, default to ["LinkedIn", "Twitter/X", "Blog Post"]

2. TIMEFRAME - This is critical! Look for:
   - Specific year: "2025" or "en 2025" → "year:2025"
   - "today" or "últimas 24 horas" → "24h"
   - "this week" or "esta semana" → "7d"
   - "this month" or "este mes" → "30d"
   - "last year" or "año pasado" → "year:LASTYEAR"
   - If a year like 2024, 2025 is mentioned, use "year:XXXX" format
   - If not mentioned, default to "7d"

3. NUMBER OF IDEAS - Look for numbers:
   - "10 ideas" or "10 content ideas" → 10
   - "give me 5" → 5
   - If not mentioned, default to 5

4. MAIN TOPIC - Extract the core research topic (what to search for)
   - REMOVE platform names (LinkedIn, Twitter, etc.) from the topic
   - REMOVE instructions like "create a post about", "write 3 tweets"
   - REMOVE quantities like "3 ideas", "5 posts"
   - Include the year if specified (e.g., "technology trends 2025")
   - Example: "AI trends for LinkedIn" -> Topic: "AI trends"

Return ONLY valid JSON (no markdown, no explanation):
{
  "platforms": ["LinkedIn", "Twitter/X"],
  "timeframe": "7d",
  "region": "Global",
  "topic": "extracted topic here",
  "ideaCount": 5,
  "yearFilter": null
}`;

        let scope;

        // In refine mode, use the updated constraints directly instead of re-extracting
        if (isRefine) {
            console.log("[Orchestrator] Refine mode - using form constraints directly");
            scope = {
                platforms: currentRun.constraints.platforms || ["LinkedIn", "Twitter/X"],
                timeframe: currentRun.constraints.timeframe || "7d",
                region: currentRun.constraints.region || "Global",
                topic: currentRun.userQuery,
                ideaCount: currentRun.constraints.ideaCount || 5,
                include: currentRun.constraints.include,
                exclude: currentRun.constraints.exclude,
            };
            await emit("main", "log", { msg: `🔄 Refining with: Platforms=${scope.platforms.join(", ")}, Ideas=${scope.ideaCount}, Timeframe=${scope.timeframe}, Region=${scope.region}` });
        } else {
            // Normal mode - extract scope from user query via AI
            try {
                await emit("main", "log", { msg: "🔍 Analyzing your request..." });
                const scopeResult = await model.generateContent(scopePrompt);
                const scopeText = scopeResult.response.text();
                console.log("[Orchestrator] Scope response:", scopeText);

                const jsonMatch = scopeText.match(/\{[\s\S]*\}/);
                scope = jsonMatch ? JSON.parse(jsonMatch[0]) : {
                    platforms: ["LinkedIn", "Twitter/X"],
                    timeframe: "7d",
                    region: "Global",
                    topic: currentRun.userQuery,
                    ideaCount: 5
                };
            } catch (e) {
                console.error("[Orchestrator] Scope extraction failed:", e);
                scope = {
                    platforms: ["LinkedIn", "Twitter/X"],
                    timeframe: "7d",
                    region: "Global",
                    topic: currentRun.userQuery,
                    ideaCount: 5
                };
            }
        }

        await emit("main", "log", {
            msg: `📌 Scope: ${scope.topic} | Platforms: ${scope.platforms.join(", ")} | Timeframe: ${scope.timeframe}`
        });

        // ========== STEP 2: Plan Research ==========
        console.log("[Orchestrator] Planning research...");
        await emit("main", "status", { step: "🎯 Planning research strategy..." });

        // Get current date for context
        const today = new Date();
        const currentDate = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentYear = today.getFullYear();

        // Handle different timeframe formats
        let dateContext = "";
        let searchTimeframeText = "";

        if (scope.timeframe.startsWith("year:")) {
            // Specific year requested (e.g., "year:2025")
            const targetYear = scope.timeframe.split(":")[1];
            dateContext = `Year ${targetYear}`;
            searchTimeframeText = `specifically for year ${targetYear}`;
            await emit("main", "log", { msg: `📅 Searching for content from year ${targetYear}` });
        } else {
            // Days-based timeframe
            // Days-based timeframe
            let daysBack = 30; // Default

            if (scope.timeframe === "24h") {
                daysBack = 1;
            } else if (scope.timeframe.endsWith("d")) {
                const days = parseInt(scope.timeframe.replace("d", ""));
                if (!isNaN(days)) {
                    daysBack = days;
                }
            }
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() - daysBack);
            const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            dateContext = `Last ${daysBack} days (${dateRange})`;
            searchTimeframeText = `from the last ${daysBack} days`;
            await emit("main", "log", { msg: `📅 Date context: ${currentDate} (searching last ${daysBack} days)` });
        }

        // Determine target year for queries
        const targetYear = scope.timeframe.startsWith("year:")
            ? scope.timeframe.split(":")[1]
            : currentYear;

        const planPrompt = `You are a research planner. Given this topic: "${scope.topic}"

IMPORTANT DATE CONTEXT:
- Today's date: ${currentDate}
- Current year: ${currentYear}
- Search timeframe: ${dateContext}
- Target year for queries: ${targetYear}
${scope.timeframe.startsWith("year:")
                ? `- User specifically requested content from year ${targetYear}. Include "${targetYear}" in your search queries.`
                : `- DO NOT use outdated years! Use ${currentYear}.`}

Constraints:
- Timeframe: ${searchTimeframeText}
- Region: ${scope.region}

Create a research plan with 3-5 specific search queries to find trending topics about "${scope.topic}".

IMPORTANT: 
- Include "${currentYear}" in date-sensitive queries
- Use terms like "latest", "this week", "January 2026" instead of outdated references
- Focus on recent news and current trends

Return JSON format:
{
  "queries": ["query1", "query2", ...],
  "sources": ["web"],
  "strategy": "explanation of approach"
}`;

        await emit("main", "log", { msg: "Generating research plan with AI..." });

        let plan;
        try {
            const planResult = await model.generateContent(planPrompt);
            const planText = planResult.response.text();
            console.log("[Orchestrator] Plan response:", planText);

            const jsonMatch = planText.match(/\{[\s\S]*\}/);
            plan = jsonMatch ? JSON.parse(jsonMatch[0]) : {
                queries: [scope.topic],
                sources: ["web"],
                strategy: "Direct search"
            };
            // Attach scope to plan for later use
            plan.scope = scope;
        } catch (e) {
            console.error("[Orchestrator] Plan generation failed:", e);
            plan = {
                queries: [scope.topic, `${scope.topic} trends`, `${scope.topic} news`],
                sources: ["web"],
                strategy: "Default search strategy",
                scope: scope
            };
        }

        await emit("main", "log", {
            msg: `Research plan: ${plan.queries.length} queries - ${plan.strategy}`
        });

        // ========== STEP 2: Researching ==========
        console.log("[Orchestrator] Researching...");
        await updateStatus("researching");
        await emit("main", "status", { step: "🔍 Searching for trending topics..." });

        const searchClient = new SearchClient();
        const candidates: any[] = [];

        for (const query of plan.queries) {
            await emit("main", "log", { msg: `Searching: "${query}"` });

            try {
                // Check cache first (skip if refining to force fresh results with new constraints)
                const cachedResults = !isRefine ? await getCachedSearch(query) : null;

                let results;
                if (cachedResults && cachedResults.length > 0) {
                    await emit("main", "log", { msg: `✓ Using cached results for: "${query}"` });
                    results = cachedResults;
                } else {
                    // Cache miss - make API call
                    await emit("main", "log", { msg: `⚡ Fetching fresh results for: "${query}"` });
                    results = await searchClient.searchTrends(query, currentRun.constraints);

                    // Cache the results
                    await cacheSearch(query, results);
                }

                // Process top 3 results per query, excluding problematic domains
                for (const result of results.slice(0, 3)) {
                    // Skip theinformation.com as URLs are often incomplete
                    if (result.url.includes('theinformation.com')) {
                        continue;
                    }

                    candidates.push({
                        title: result.title,
                        url: result.url,
                        snippet: result.content.substring(0, 200),
                        relevanceScore: result.score,
                    });

                    await emit("main", "finding", {
                        trendCandidate: result.title,
                        sourceRefs: [{
                            url: result.url,
                            title: result.title,
                            snippet: result.content.substring(0, 150),
                        }],
                    });
                }
            } catch (e) {
                console.error("[Orchestrator] Search failed for query:", query, e);
                await emit("main", "log", { msg: `Search failed for: ${query}` });
            }
        }

        await emit("main", "log", { msg: `Found ${candidates.length} trend candidates` });

        if (candidates.length === 0) {
            await emit("main", "log", { msg: "❌ No relevant trends found. Try refining your search parameters." });
            await emit("main", "status", { step: "⚠️ No results found. Please refine search." });

            // Set approval to refine to indicate intervention needed
            await convex.mutation(api.runs.setApproval, {
                runId: runId as Id<"runs">,
                approval: "refine",
                refinement: "No search results found"
            });

            return NextResponse.json({ success: false, reason: "no_candidates" });
        }

        // ========== STEP 3: Synthesizing Report ==========
        console.log("[Orchestrator] Synthesizing report...");
        await emit("main", "status", { step: "📊 Synthesizing research report..." });

        const candidatesText = candidates
            .map((c, i) => `${i + 1}. ${c.title}\n   URL: ${c.url}\n   Snippet: ${c.snippet}`)
            .join("\n\n");

        const reportPrompt = `You are a trend analyst. Analyze these research findings and create a report of the top 5-10 most significant trends.

User Query: "${run.userQuery}"

Research Findings:
${candidatesText}

Create a JSON report with:
{
  "trends": [
    {
      "title": "Trend name",
      "description": "2-3 sentence explanation of why this is trending",
      "confidence": 0.0-1.0,
      "sources": [
        {
          "url": "EXACT full URL from the research findings above (e.g., https://example.com/article-title-123)",
          "title": "source title",
          "snippet": "relevant excerpt"
        }
      ]
    }
  ]
}

CRITICAL RULES FOR SOURCES:
- ALWAYS use the EXACT full URL from the "URL:" field in the research findings above
- NEVER simplify URLs to just domain names (e.g., DON'T use "theinformation.com", USE "https://www.theinformation.com/articles/ai-video-generation-2026")
- NEVER invent or modify URLs
- Each trend should cite 1-3 specific sources with their COMPLETE URLs

Deduplicate similar trends. Rank by relevance. Include 3-5 trends.`;

        let report;
        try {
            const reportResult = await model.generateContent(reportPrompt);
            const reportText = reportResult.response.text();
            console.log("[Orchestrator] Report response:", reportText);

            const jsonMatch = reportText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Failed to parse report JSON");

            report = {
                ...JSON.parse(jsonMatch[0]),
                generatedAt: new Date().toISOString(),
            };
        } catch (e) {
            console.error("[Orchestrator] Report generation failed:", e);
            report = {
                trends: candidates.slice(0, 5).map((c, i) => ({
                    title: c.title,
                    description: c.snippet,
                    confidence: 0.8 - (i * 0.1),
                    sources: [{ url: c.url, title: c.title, snippet: c.snippet }],
                })),
                generatedAt: new Date().toISOString(),
            };
        }

        // Save report to database
        await convex.mutation(api.runs.setResearchReport, {
            runId: runId as Id<"runs">,
            report,
        });

        await emit("main", "report", { report });

        // Save scope for idea generation
        await emit("main", "scope", { scope: plan.scope });

        await updateStatus("awaiting_approval");
        await emit("main", "status", { step: `✋ Waiting for your approval | Will generate ${plan.scope.ideaCount} ideas for: ${plan.scope.platforms.join(", ")}` });

        console.log("[Orchestrator] Complete - awaiting approval");
        return NextResponse.json({ success: true, status: "awaiting_approval" });

    } catch (error) {
        console.error("[Orchestrator] Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
