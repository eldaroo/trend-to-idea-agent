import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Google Custom Search API wrapper (FREE tier: 100 searches/day)
 * 
 * Alternative free search solution that works in edge runtime
 * Get your API key: https://developers.google.com/custom-search/v1/overview
 */

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export class SearchClient {
  // ⚡ TESTING MODE: Set to true to always use mock data
  private FORCE_MOCK = false;

  /**
   * Search using Google Custom Search API (100 free queries/day)
   * Falls back to mock data if no API key is configured
   */
  async search(
    query: string,
    options: {
      maxResults?: number;
      dateRestrict?: string; // e.g., "d7" for 7 days, "d20" for 20 days, "m1" for 1 month
    } = {}
  ): Promise<SearchResponse> {
    const { maxResults = 10, dateRestrict } = options;

    // Force mock mode for testing
    if (this.FORCE_MOCK) {
      console.log("🧪 [MOCK MODE] Using mock data for:", query);
      return this.getMockResults(query, maxResults);
    }

    // Check if Google Custom Search is configured
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      // Fallback to mock trending data for demo purposes
      console.warn("Google Custom Search not configured. Using mock data.");
      return this.getMockResults(query, maxResults);
    }

    try {
      let url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${Math.min(maxResults, 10)}`;

      // Add date restriction if specified
      if (dateRestrict) {
        url += `&dateRestrict=${dateRestrict}`;
        console.log(`📅 [DATE FILTER] Restricting to: ${dateRestrict}`);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.statusText}`);
      }

      const data = await response.json();

      const formattedResults: SearchResult[] = (data.items || []).map((item: any, index: number) => ({
        title: item.title || "",
        url: item.link || "",
        content: item.snippet || "",
        score: 1 - (index * 0.05),
        published_date: undefined,
      }));

      return {
        query,
        results: formattedResults,
      };
    } catch (error) {
      console.error("Google Search error:", error);
      // Fallback to mock data on error
      return this.getMockResults(query, maxResults);
    }
  }

  /**
   * Mock results for demo/testing when API is not configured
   */
  private getMockResults(query: string, maxResults: number): SearchResponse {
    const mockResults: SearchResult[] = [
      {
        title: `${query} - Latest Developments`,
        url: "https://example.com/article1",
        content: `Recent updates and trends related to ${query}. This is mock data for demonstration purposes.`,
        score: 1.0,
      },
      {
        title: `Top ${query} Trends This Week`,
        url: "https://example.com/article2",
        content: `Analysis of current ${query} trends and their impact on the industry.`,
        score: 0.95,
      },
      {
        title: `${query}: What You Need to Know`,
        url: "https://example.com/article3",
        content: `Comprehensive guide to understanding ${query} and its implications.`,
        score: 0.9,
      },
    ].slice(0, maxResults);

    return {
      query,
      results: mockResults,
    };
  }

  /**
   * Search for trending topics with enhanced queries
   */
  async searchTrends(
    baseQuery: string,
    constraints: {
      timeframe?: string;
      region?: string;
      include?: string[];
      exclude?: string[];
    }
  ): Promise<SearchResult[]> {
    // Build enhanced query with constraints
    let enhancedQuery = baseQuery;

    // Add timeframe context
    if (constraints.timeframe) {
      const timeMap: Record<string, string> = {
        "24h": "today",
        "7d": "this week",
        "30d": "this month",
      };
      const timeContext = timeMap[constraints.timeframe] || "recent";
      enhancedQuery += ` ${timeContext}`;
    }

    // Add "trending" or "news" to get fresh content
    if (!enhancedQuery.toLowerCase().includes("trending")) {
      enhancedQuery += ` trending news`;
    }

    // Add region context
    if (constraints.region && constraints.region !== "Global") {
      enhancedQuery += ` in ${constraints.region}`;
    }

    // Add include keywords
    if (constraints.include && constraints.include.length > 0) {
      enhancedQuery += ` ${constraints.include.join(" ")}`;
    }

    // Add exclude keywords
    if (constraints.exclude && constraints.exclude.length > 0) {
      const excludeTerms = constraints.exclude.map((term) => `-${term}`).join(" ");
      enhancedQuery += ` ${excludeTerms}`;
    }

    // Convert timeframe to Google's dateRestrict format
    let dateRestrict: string | undefined;
    if (constraints.timeframe) {
      const dateMap: Record<string, string> = {
        "24h": "d1",
        "7d": "d7",
        "20d": "d20",
        "30d": "m1",
        "year:2026": "d365", // Approximate - Google doesn't support year filter directly
        "year:2025": "d730",
      };
      dateRestrict = dateMap[constraints.timeframe] || "d30";
    }

    const response = await this.search(enhancedQuery, {
      maxResults: 15,
      dateRestrict,
    });

    return response.results;
  }
}

/**
 * Helper function to get Gemini model instance
 */
export function getGeminiModel() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.2"),
    },
  });
}
