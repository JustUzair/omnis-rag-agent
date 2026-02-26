import { RunnableLambda } from "@langchain/core/runnables";
import { AgentMode } from "../types";
import { webSearch } from "../../utils/webSearch";
import { openUrl } from "../../utils/openUrl";
import { summarize } from "../../utils/summarize";

const TOP_N_RESULTS = 5;

/*
query "latest news on AI"
visit every result page
summarize
return answer, sources, mode, etc
*/

// Step 1

export const webSearchStep = RunnableLambda.from(
  async (input: { query: string; mode: AgentMode }) => {
    const results = await webSearch(input.query);
    return {
      ...input,
      results,
    };
  },
);

// Step 2

export const openAndSummarizeStep = RunnableLambda.from(
  async (input: { query: string; mode: AgentMode; results: any[] }) => {
    if (!Array.isArray(input.results) || input.results.length === 0) {
      return {
        ...input,
        pageSummaries: [],
        fallback: "No results" as const,
      };
    }

    const topResults = input.results.slice(0, TOP_N_RESULTS);

    const settledResults = await Promise.allSettled(
      topResults.map(async (result: any) => {
        const opened = await openUrl(result.url);
        const summarizedContent = await summarize(opened.content);

        return {
          url: opened.url,
          summary: summarizedContent.summary,
        };
      }),
    );

    const pageSummaries = settledResults
      .filter(result => result.status === "fulfilled")
      .map(s => s.value);

    if (pageSummaries.length === 0) {
      const fallbackSnippetSummaries = topResults
        .map(result => ({
          url: result.url,
          summary: String(result.snippet || result.title || "").trim(),
        }))
        .filter((x: any) => x.summary.length > 0);

      return {
        ...input,
        pageSummaries: fallbackSnippetSummaries,
        fallback: "Snippets" as const,
      };
    }

    return {
      ...input,
      pageSummaries,
      fallback: "None" as const,
    };
  },
);
