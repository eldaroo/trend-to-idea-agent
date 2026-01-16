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

        // Round-robin through platforms until we have enough ideas
        let platformIndex = 0;
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = 10; // Prevent infinite loop

        while (ideas.length < ideaCount && consecutiveFailures < maxConsecutiveFailures) {
            const platform = platforms[platformIndex % platforms.length];
            await emit("main", "log", { msg: `Generating idea ${ideas.length + 1}/${ideaCount} for ${platform}...` });

            // Build context of previously generated ideas to avoid duplicates
            const previousIdeasContext = ideas.length > 0
                ? `\n\nPREVIOUSLY GENERATED IDEAS (DO NOT REPEAT THESE):\n${ideas.map((idea, idx) =>
                    `${idx + 1}. [${idea.platform}] ${idea.idea.substring(0, 100)}...`
                ).join("\n")}\n\nGenerate a COMPLETELY DIFFERENT idea. Use a different trend, different angle, different format.`
                : "";

            const ideaPrompt = `You are the content strategist for **Gallium** – an AI-native operating system for marketing.

=== GALLIUM IDENTITY ===
- **What we are**: An AI OS that consolidates marketing workflows into a single intelligent system
- **Core values**: Speed, Leverage, Rigor, Systems Thinking, Modern Taste
- **We are NOT**: Another AI chatbot, a dashboard, or a "suite of tools"
- **Our edge**: We don't just *use* AI, we *are* AI. Prediction > Reaction.

=== VOICE & TONE ===
- Clear, sharp, slightly edgy. Technical but human.
- Strong opinions backed by evidence. "This actually works" energy.
- NEVER: Corporate speak, buzzword soup, vague promises, "leverage synergies"
- ALWAYS: Concrete takeaways, punchy hooks, credible evidence, real examples

=== TARGET PERSONA ===
You're writing for a **Growth Lead at a fast-moving D2C brand** who:
- Is drowning in dashboards and context-switching
- Skeptical of AI hype but hungry for real leverage
- Values speed and systems over "more tools"
- Wants to ship, not plan meetings about shipping

=== PLATFORM: ${platform} ===
${platform === "LinkedIn" ? "- Format: Text post, 800-1200 chars max. Hook in first line. Use line breaks. End with a take or CTA." : ""}
${platform === "Twitter/X" ? "- Format: Thread starter or single tweet. Punchy. Under 280 chars for single, 3-5 tweets for thread. Use ⚡️ sparingly." : ""}
${platform === "Instagram" ? "- Format: Carousel concept or story sequence. Visual-first thinking. Caption should complement, not repeat visuals." : ""}
${platform === "TikTok" ? "- Format: Video concept with hook, body, CTA. First 3 seconds are everything. Educational or hot take style." : ""}
${platform === "Blog Post" ? "- Format: Article outline with headline, subheads, and key points. SEO-aware but human-first." : ""}

=== TRENDING TOPICS TO REFERENCE ===
${trendsText}

=== YOUR TASK ===
Generate ONE content idea for ${platform} that:
1. References one of the trends above (cite it)
2. Reflects Gallium's worldview (speed > perfection, systems > tools, leverage > labor)
3. Has a hook that stops the scroll
4. Ends with a strong take or thought-provoking question
5. SOUNDS LIKE GALLIUM – sharp, edgy, anti-corporate
${previousIdeasContext}

CRITICAL RULES:
- DO NOT mention "Gallium" by name anywhere in the content
- DO NOT pitch a product or include links like "[link to Gallium]"
- DO NOT write sales copy or promotional content
- This is THOUGHT LEADERSHIP, not advertising
- Write as if you're a marketing expert sharing insights, NOT selling a tool

=== OUTPUT FORMAT (JSON only, no markdown) ===
{
  "platform": "${platform}",
  "idea": "Your complete content idea with hook, body, and CTA",
  "why": "One sentence explaining why this idea will resonate with the target audience",
  "trendCitation": {
    "trendTitle": "The trend title you're referencing"
  }
}`;

            // Retry logic: try up to 3 times if it fails
            let retryCount = 0;
            const maxRetries = 3;
            let success = false;

            while (!success && retryCount < maxRetries) {
                try {
                    const ideaResult = await model.generateContent(ideaPrompt);
                    let ideaText = ideaResult.response.text();

                    // Sanitize JSON: remove control characters that break JSON parsing
                    ideaText = ideaText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

                    const jsonMatch = ideaText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const idea = JSON.parse(jsonMatch[0]);

                        // Validate structure
                        if (typeof idea.idea !== 'string' || !idea.idea.trim()) {
                            throw new Error("Generated idea content is missing or not a string");
                        }

                        ideas.push(idea);

                        await emit("sidebar", "idea", {
                            platform: idea.platform,
                            idea: idea.idea,
                            why: idea.why,
                            trendCitation: idea.trendCitation,
                        });
                        success = true; // Success, break the retry loop
                    } else {
                        throw new Error("No valid JSON found in response");
                    }
                } catch (e) {
                    retryCount++;
                    console.error(`[Resume] Attempt ${retryCount}/${maxRetries} failed for ${platform}:`, e);

                    if (retryCount < maxRetries) {
                        await emit("main", "log", { msg: `⚠️ Idea ${ideas.length + 1} failed, retrying (${retryCount}/${maxRetries})...` });
                        // Wait a bit before retrying
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } else {
                        // Max retries reached, log final error
                        await emit("main", "log", { msg: `❌ Failed to generate idea ${ideas.length + 1} after ${maxRetries} attempts` });
                        consecutiveFailures++;
                    }
                }
            }

            // If we successfully generated an idea, reset consecutive failures
            if (success) {
                consecutiveFailures = 0;
            }

            // Move to next platform in round-robin
            platformIndex++;

            // Small delay for streaming effect
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        await updateStatus("done");
        await emit("main", "status", { step: `✅ Complete! Generated ${ideas.length} ideas for ${platforms.join(", ")}` });
        await emit("main", "log", { msg: `Generated ${ideas.length} content ideas for: ${platforms.join(", ")}` });

        console.log("[Resume] Complete - ideas generated");

        return NextResponse.json({
            success: true,
            ideasGenerated: ideas.length,
        });
    } catch (e) {
        console.error("[Resume] Error:", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
