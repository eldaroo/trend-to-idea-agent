import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { getGeminiModel } from "../../../../lib/research/search";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface RequestBody {
    runId: string;
}

export async function POST(request: Request) {
    try {
        const { runId } = (await request.json()) as RequestBody;
        console.log("[Resume] Starting idea generation for run:", runId);

        // Get the run
        const run = await convex.query(api.runs.getRun, { runId: runId as Id<"runs"> });
        if (!run) {
            return NextResponse.json({ error: "Run not found" }, { status: 404 });
        }

        if (!run.researchReport) {
            return NextResponse.json({ error: "No research report to generate ideas from" }, { status: 400 });
        }

        // Get events to find the scope
        const events = await convex.query(api.events.getEventsBySurface, {
            runId: runId as Id<"runs">,
            surface: "main"
        });

        // Find the scope event
        const scopeEvent = events?.find((e: any) => e.type === "scope");
        const scope = scopeEvent?.payload?.scope || {
            platforms: ["LinkedIn", "Twitter/X"],
            ideaCount: 5
        };

        console.log("[Resume] Using scope:", scope);

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

        // ========== Generate Ideas ==========
        console.log("[Resume] Generating ideas for platforms:", scope.platforms);
        await updateStatus("ideating");
        await emit("sidebar", "status", { step: `💡 Generating ${scope.ideaCount} ideas for ${scope.platforms.join(", ")}...` });
        await emit("main", "status", { step: `💡 Generating ideas for: ${scope.platforms.join(", ")}` });

        const model = getGeminiModel();

        const trendsText = run.researchReport.trends
            .map((t, i) => `${i + 1}. ${t.title}\n   ${t.description}`)
            .join("\n\n");

        // Use platforms from scope
        const platforms = scope.platforms || ["LinkedIn", "Twitter/X"];
        const ideaCount = scope.ideaCount || 5;
        const ideas: any[] = [];

        // Calculate ideas per platform
        const ideasPerPlatform = Math.ceil(ideaCount / platforms.length);

        for (const platform of platforms) {
            for (let i = 0; i < ideasPerPlatform && ideas.length < ideaCount; i++) {
                await emit("main", "log", { msg: `Generating idea ${ideas.length + 1}/${ideaCount} for ${platform}...` });

                // Build context of previously generated ideas to avoid duplicates
                const previousIdeasContext = ideas.length > 0
                    ? `\n\nPREVIOUSLY GENERATED IDEAS (DO NOT REPEAT THESE):\n${ideas.map((idea, idx) =>
                        `${idx + 1}. [${idea.platform}] ${idea.idea.substring(0, 100)}...`
                    ).join("\n")}\n\nGenerate a COMPLETELY DIFFERENT idea. Use a different trend, different angle, different format.`
                    : "";

                const ideaPrompt = `You are a creative content strategist for "Gallium", an AI-native operating system for marketing.
                
BRAND VOICE & IDENTITY:
- Values: Speed, Leverage, Rigor, Systems Thinking, Modern Taste.
- Voice: Clear, sharp, slightly edgy, technical but human. No corporate fluff.
- Audience: Founders, growth leads, and small marketing teams who want to move faster with AI.
- Style: Concrete takeaways, strong opinions, punchy hooks, credible evidence, "this actually works" energy.

Generate ONE unique content idea for ${platform}.

TRENDING TOPICS TO REFERENCE:
${trendsText}

REQUIREMENTS:
- Platform: ${platform} (use appropriate format, length, tone)
- Pick a DIFFERENT trend than ideas #${ideas.length > 0 ? ideas.map((_, i) => i + 1).join(", #") : "none yet"}
- Create a fresh angle - different hook, different format, different CTA
- Be specific and actionable
- Keep it concise (2-3 paragraphs max)
- SOUND LIKE GALLIUM (Not a generic AI assistant)
${previousIdeasContext}

Return ONLY valid JSON (no markdown):
{
  "platform": "${platform}",
  "idea": "Your creative content idea here",
  "trendCitation": {
    "trendTitle": "which trend this references"
  }
}`;

                try {
                    const ideaResult = await model.generateContent(ideaPrompt);
                    const ideaText = ideaResult.response.text();

                    const jsonMatch = ideaText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const idea = JSON.parse(jsonMatch[0]);
                        ideas.push(idea);

                        await emit("sidebar", "idea", {
                            platform: idea.platform,
                            idea: idea.idea,
                            trendCitation: idea.trendCitation,
                        });
                    }
                } catch (e) {
                    console.error(`[Resume] Failed to generate idea for ${platform}:`, e);
                }

                // Small delay for streaming effect
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        await updateStatus("done");
        await emit("main", "status", { step: `✅ Complete! Generated ${ideas.length} ideas for ${platforms.join(", ")}` });
        await emit("main", "log", { msg: `Generated ${ideas.length} content ideas for: ${platforms.join(", ")}` });

        console.log("[Resume] Complete - ideas generated");
        return NextResponse.json({ success: true, ideas: ideas.length });

    } catch (error) {
        console.error("[Resume] Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
