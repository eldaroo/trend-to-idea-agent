import { Annotation } from "@langchain/langgraph";

/**
 * Type definitions for the Trend-to-Idea Agent
 */

export interface TrendCandidate {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  relevanceScore: number;
}

export interface SourceRef {
  url: string;
  title: string;
  snippet: string;
  publishedDate?: string;
}

export interface Trend {
  title: string;
  description: string;
  confidence: number;
  sources: SourceRef[];
}

export interface ResearchReport {
  trends: Trend[];
  generatedAt: string;
}

export interface ResearchPlan {
  queries: string[];
  sources: string[];
  strategy: string;
}

export interface Constraints {
  timeframe?: string;
  region?: string;
  include?: string[];
  exclude?: string[];
  platforms?: string[];
}

export interface Idea {
  platform: string;
  idea: string;
  trendCitation: {
    trendTitle: string;
    sourceUrl: string;
  };
}

/**
 * LangGraph State Definition
 * 
 * This state flows through all nodes in the graph.
 * Nodes can read and update any part of the state.
 */
export const AgentState = Annotation.Root({
  // Run identification
  runId: Annotation<string>,

  // User input
  userQuery: Annotation<string>,
  constraints: Annotation<Constraints>,

  // Research planning
  plan: Annotation<ResearchPlan | null>({
    default: () => null,
  }),

  // Research results
  candidates: Annotation<TrendCandidate[]>({
    default: () => [],
  }),

  // Synthesized report
  report: Annotation<ResearchReport | null>({
    default: () => null,
  }),

  // HITL approval state
  approval: Annotation<"approved" | "refine" | "restart" | null>({
    default: () => null,
  }),

  refinement: Annotation<string | null>({
    default: () => null,
  }),

  // Generated ideas
  ideas: Annotation<Idea[]>({
    default: () => [],
  }),

  // Error tracking
  error: Annotation<string | null>({
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
