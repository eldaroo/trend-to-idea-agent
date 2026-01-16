import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, AgentStateType } from "./state";
import {
    planResearch,
    fetchTrends,
    synthesizeReport,
    awaitApproval,
    routeAfterApproval,
    spawnIdeaAgent,
    ConvexEmitter,
} from "./nodes";

/**
 * Create the LangGraph workflow
 * 
 * Flow:
 * START → planResearch → fetchTrends → synthesizeReport → awaitApproval
 *                                                              ↓
 *                                                        routeAfterApproval
 *                                                         ↓         ↓
 *                                                   spawnIdeaAgent  (loop)
 *                                                         ↓
 *                                                        END
 */

export function createAgentGraph(emitter: ConvexEmitter) {
    // Create the graph
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workflow = new StateGraph(AgentState) as any;

    // Add nodes (wrap with emitter)
    workflow.addNode("planResearch", async (state: AgentStateType) =>
        planResearch(state, emitter)
    );

    workflow.addNode("fetchTrends", async (state: AgentStateType) =>
        fetchTrends(state, emitter)
    );

    workflow.addNode("synthesizeReport", async (state: AgentStateType) =>
        synthesizeReport(state, emitter)
    );

    workflow.addNode("awaitApproval", async (state: AgentStateType) =>
        awaitApproval(state, emitter)
    );

    workflow.addNode("routeAfterApproval", async (state: AgentStateType) =>
        routeAfterApproval(state, emitter)
    );

    workflow.addNode("spawnIdeaAgent", async (state: AgentStateType) =>
        spawnIdeaAgent(state, emitter)
    );

    // Define edges
    workflow.addEdge(START, "planResearch");
    workflow.addEdge("planResearch", "fetchTrends");
    workflow.addEdge("fetchTrends", "synthesizeReport");
    workflow.addEdge("synthesizeReport", "awaitApproval");

    // Conditional routing after approval
    workflow.addConditionalEdges(
        "awaitApproval",
        (state: AgentStateType) => {
            // If no approval yet, stop (HITL checkpoint)
            if (!state.approval) {
                return "wait";
            }
            return "route";
        },
        {
            wait: END,
            route: "routeAfterApproval",
        }
    );

    // Routing logic after approval decision
    workflow.addConditionalEdges(
        "routeAfterApproval",
        (state: AgentStateType) => {
            if (state.approval === "approved") {
                return "generate";
            } else if (state.approval === "refine") {
                return "refine";
            } else if (state.approval === "restart") {
                return "restart";
            }
            return "end";
        },
        {
            generate: "spawnIdeaAgent",
            refine: "planResearch", // Loop back with updated constraints
            restart: "planResearch", // Loop back from scratch
            end: END,
        }
    );

    workflow.addEdge("spawnIdeaAgent", END);

    return workflow.compile();
}
