import { RunnableLambda } from "@langchain/core/runnables";
import { AgentMode } from "./types.js";
import { SearchInputSchema } from "../utils/schema.js";

export function routeStrategy(query: string): AgentMode {
  const trimmedQuery = query.toLowerCase().trim();
  const isQueryLongEnough = trimmedQuery.length > 50;
  const recentYearRegex = /\b20(2[4-9]|3[0-9])\b/.test(trimmedQuery);

  const patterns: RegExp[] = [
    // --- COMPARISON & RANKINGS ---
    /\btop[-\s]*\d+\b/u, // Matches "top 10", "top-5", etc.
    /\bbest\b/u, // Matches "best" for product/service queries
    /\brank(?:ing|ings)?\b/u, // Matches "rank", "ranking", or "rankings"
    /\bwhich\s+is\s+better\b/u, // Matches direct comparison questions
    /\b(?:vs\.?|versus)\b/u, // Matches "product A vs product B"
    /\bcompare|comparison\b/u, // Matches general comparison requests

    // --- FINANCIALS & PRICING ---
    /\bprice|prices|pricing|cost|costs|cheapest|cheaper|affordable\b/u, // Financial inquiries
    /\bunder\s*\d+(?:\s*[kK])?\b/u, // Matches budget constraints like "under 500" or "under 10k"
    /\p{Sc}\s*\d+/u, // Matches currency symbols followed by numbers (e.g., $50, €100)

    // --- RECENCY & TRENDING ---
    /\blatest|today|now|current\b/u, // Matches time-sensitive "now" or "today" queries
    /\bnews|breaking|trending\b/u, // Matches current events and news cycles
    /\b(?:released?|launch(?:ed)?|announce(?:d)?|update(?:d)?)\b/u, // Matches product/software releases
    /\bchangelog|release\s*notes?\b/u, // Matches technical version history updates

    // --- LIFECYCLE & FUTURE ---
    /\bdeprecated|eol|end\s*of\s*life|sunset\b/u, // Matches software status or product retirement
    /\broadmap\b/u, // Matches future plans or project trajectories

    // --- COMPATIBILITY & SETUP ---
    /\bworks\s+with|compatible\s+with|support(?:ed)?\s+on\b/u, // Matches hardware/software compatibility
    /\binstall(?:ation)?\b/u, // Matches installation guides which change over versions

    // --- LOCATION-BASED ---
    /\bnear\s+me|nearby\b/u, // Matches local business/service searches

    // --- NEW: URL & DOCUMENT BROWSING ---
    /https?:\/\/[^\s]+/u, // Matches URLs (triggers browsing/scraping)
    /\.(?:com|org|net|io|edu|gov)\b/u, // Matches common domain extensions in queries

    // --- NEW: RECENT REVIEWS & REPUTATION ---
    /\breview|reviews|rating|ratings\b/u, // Matches user feedback or professional reviews
    /\breddit|twitter|x\.com|forum\b/u, // Matches requests for community sentiment/discussions

    // --- NEW: TUTORIALS & GUIDES ---
    /\bhow\s+to\s+(?:setup|fix|build|configure)\b/u, // Matches specific technical "how-to" tasks
    /\bstuck\s+on|error\s+code\b/u, // Matches troubleshooting (likely needs web search for errors)
  ];

  const isQueryInPatterns = patterns.some(pattern =>
    pattern.test(trimmedQuery),
  );

  if (isQueryLongEnough || isQueryInPatterns || recentYearRegex) return "web";
  return "direct";
}

export const routeStep = RunnableLambda.from(
  async (input: {
    query: String;
  }): Promise<{ query: string; mode: AgentMode }> => {
    const { query } = SearchInputSchema.parse(input);
    const mode = routeStrategy(query);
    return {
      query,
      mode,
    };
  },
);
