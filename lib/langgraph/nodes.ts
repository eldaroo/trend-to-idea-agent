import { AgentStateType, TrendCandidate, Trend } from "./state";
import { SearchClient, getGeminiModel } from "../research/search";

/**
 * Convex client helper for emitting events from nodes
 * This will be injected into the node context
 */
export interface ConvexEmitter {
    emit: (surface: "main" | "sidebar", type: string, payload: any) => Promise<void>;
    updateStatus: (status: string) => Promise<void>;
}

/**
 * Node: Plan Research
 * Analyzes the user query and decides on research strategy
 */
export async function planResearch(
    state: AgentStateType,
    emitter: ConvexEmitter
): Promise<Partial<AgentStateType>> {
    await emitter.updateStatus("planning");
    await emitter.emit("main", "status", { step: "Planning research strategy" });

    try {
        const model = getGeminiModel();

        const prompt = `You are a research planner. Given this user query: "${state.userQuery}"
    
Constraints:
- Timeframe: ${state.constraints.timeframe || "7d"}
- Region: ${state.constraints.region || "Global"}
- Include keywords: ${state.constraints.include?.join(", ") || "none"}
- Exclude keywords: ${state.constraints.exclude?.join(", ") || "none"}

Create a research plan with:
1. 3-5 specific search queries to find trending topics
2. Strategy explanation

Return JSON format:
{
  "queries": ["query1", "query2", ...],
  "sources": ["web"],
  "strategy": "explanation of approach"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : {
            queries: [state.userQuery],
            sources: ["web"],
            strategy: "Direct search"
        };

        await emitter.emit("main", "log", {
            msg: `Research plan: ${plan.queries.length} queries across ${plan.sources.join(", ")}`
        });

        return { plan };
    } catch (error) {
        await emitter.emit("main", "error", {
            message: "Failed to plan research",
            detail: String(error)
        });
        return { error: String(error) };
    }
}

/**
 * Node: Fetch Trends
 * Executes research queries and streams findings
 */
export async function fetchTrends(
    state: AgentStateType,
    emitter: ConvexEmitter
): Promise<Partial<AgentStateType>> {
    await emitter.updateStatus("researching");
    await emitter.emit("main", "status", { step: "Researching trending topics" });

    // Google Custom Search (100 free queries/day) or mock data fallback
    const searchClient = new SearchClient();
    const candidates: TrendCandidate[] = [];

    try {
        const queries = state.plan?.queries || [state.userQuery];

        for (const query of queries) {
            await emitter.emit("main", "log", { msg: `Searching: ${query}` });

            const results = await searchClient.searchTrends(query, state.constraints);

            for (const result of results.slice(0, 5)) {
                const candidate: TrendCandidate = {
                    title: result.title,
                    url: result.url,
                    snippet: result.content.substring(0, 200),
                    publishedDate: result.published_date,
                    relevanceScore: result.score,
                };

                candidates.push(candidate);

                // Stream finding incrementally
                await emitter.emit("main", "finding", {
                    trendCandidate: candidate.title,
                    sourceRefs: [{
                        url: candidate.url,
                        title: candidate.title,
                        snippet: candidate.snippet,
                    }],
                });
            }
        }

        await emitter.emit("main", "log", {
            msg: `Found ${candidates.length} trend candidates`
        });

        return { candidates };
    } catch (error) {
        await emitter.emit("main", "error", {
            message: "Research failed",
            detail: String(error)
        });
        return { error: String(error) };
    }
}

/**
 * Node: Synthesize Report
 * Deduplicates, ranks, and creates final report with top trends
 */
export async function synthesizeReport(
    state: AgentStateType,
    emitter: ConvexEmitter
): Promise<Partial<AgentStateType>> {
    await emitter.emit("main", "status", { step: "Synthesizing research report" });

    try {
        const model = getGeminiModel();

        const candidatesText = state.candidates
            .map((c, i) => `${i + 1}. ${c.title}\n   URL: ${c.url}\n   Snippet: ${c.snippet}\n   Score: ${c.relevanceScore}`)
            .join("\n\n");

        const prompt = `You are a trend analyst. Analyze these research findings and create a report of the top 5-10 most significant trends.

User Query: "${state.userQuery}"

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
          "url": "source url",
          "title": "source title",
          "snippet": "relevant excerpt",
          "publishedDate": "date if available"
        }
      ]
    }
  ]
}

Deduplicate similar trends. Rank by relevance and recency. Include 5-10 trends.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse report JSON");
        }

        const reportData = JSON.parse(jsonMatch[0]);
        const report = {
            trends: reportData.trends,
            generatedAt: new Date().toISOString(),
        };

        // Emit report event
        await emitter.emit("main", "report", { report });
        await emitter.updateStatus("report_ready");

        return { report };
    } catch (error) {
        await emitter.emit("main", "error", {
            message: "Failed to synthesize report",
            detail: String(error)
        });
        return { error: String(error) };
    }
}

/**
 * Node: Await Approval
 * HITL checkpoint - waits for user decision
 */
export async function awaitApproval(
    state: AgentStateType,
    emitter: ConvexEmitter
): Promise<Partial<AgentStateType>> {
    await emitter.updateStatus("awaiting_approval");
    await emitter.emit("main", "status", {
        step: "Waiting for your approval"
    });

    // This node just sets the status
    // The graph will stop here until approval is set
    return {};
}

/**
 * Node: Route After Approval
 * Decides next step based on approval decision
 */
export async function routeAfterApproval(
    state: AgentStateType,
    emitter: ConvexEmitter
): Promise<Partial<AgentStateType>> {
    if (state.approval === "approved") {
        await emitter.emit("main", "log", { msg: "Proceeding to idea generation" });
        return {};
    } else if (state.approval === "refine") {
        await emitter.emit("main", "log", {
            msg: `Refining research with: ${state.refinement}`
        });
        // Reset for new research
        return {
            candidates: [],
            report: null,
            approval: null,
        };
    } else if (state.approval === "restart") {
        await emitter.emit("main", "log", { msg: "Restarting research" });
        return {
            plan: null,
            candidates: [],
            report: null,
            approval: null,
        };
    }

    return {};
}

/**
 * Node: Spawn Idea Agent
 * Generates platform-specific content ideas based on approved trends
 */
export async function spawnIdeaAgent(
    state: AgentStateType,
    emitter: ConvexEmitter
): Promise<Partial<AgentStateType>> {
    await emitter.updateStatus("ideating");
    await emitter.emit("sidebar", "status", { step: "Generating content ideas" });

    try {
        const model = getGeminiModel();

        const trendsText = state.report?.trends
            .map((t, i) => `${i + 1}. ${t.title}\n   ${t.description}\n   Source: ${t.sources[0]?.url}`)
            .join("\n\n");

        const defaultPlatforms = ["Twitter", "LinkedIn", "Blog Post", "YouTube", "Instagram", "TikTok"];
        // Use requested platforms if available, otherwise fallback to defaults
        // Also ensure we handle potential case inconsistency or loose matching if needed, 
        // but passing the string directly to the LLM usually works fine.
        const platforms = (state.constraints.platforms && state.constraints.platforms.length > 0)
            ? state.constraints.platforms
            : defaultPlatforms;
        const ideas = [];

        for (const platform of platforms) {
            const prompt = `You are a creative content strategist for "Gallium", an AI-native operating system for marketing.
            
BRAND VOICE & IDENTITY:
- Values: Speed, Leverage, Rigor, Systems Thinking, Modern Taste.
- Voice: Clear, sharp, slightly edgy, technical but human. No corporate fluff.
- Audience: Founders, growth leads, and small marketing teams who want to move faster with AI.
- Style: Concrete takeaways, strong opinions, punchy hooks, credible evidence, "this actually works" energy.

Generate ONE unique content idea for ${platform} based on these trending topics:

${trendsText}

The idea should:
- Be platform-appropriate
- Reference a specific trend
- Be immediately actionable
- Include the trend title and source URL for citation
- SOUND LIKE GALLIUM (Not a generic AI assistant)

Return JSON:
{
  "platform": "${platform}",
  "idea": "specific content idea",
  "trendCitation": {
    "trendTitle": "which trend this relates to",
    "sourceUrl": "source URL from the trend"
  }
}`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const idea = JSON.parse(jsonMatch[0]);
                ideas.push(idea);

                // Stream idea to sidebar
                await emitter.emit("sidebar", "idea", {
                    platform: idea.platform,
                    idea: idea.idea,
                });

                // Small delay for streaming effect
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        await emitter.updateStatus("done");
        await emitter.emit("main", "log", {
            msg: `Generated ${ideas.length} content ideas`
        });

        return { ideas };
    } catch (error) {
        await emitter.emit("sidebar", "error", {
            message: "Failed to generate ideas",
            detail: String(error)
        });
        return { error: String(error) };
    }
}
