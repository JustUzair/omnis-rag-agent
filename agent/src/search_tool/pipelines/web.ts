import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { AgentMode, Candidate } from "../types.js";
import { webSearch } from "../../utils/webSearch.js";
import { openUrl } from "../../utils/openUrl.js";
import { summarize } from "../../utils/summarize.js";
import { makeModel } from "../../shared/models.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const TOP_N_RESULTS = 5;

/*
Example flow:
query "latest news on AI"
visit every result page
summarize
return answer, sources, mode, etc
*/

// Step 1 - Get Tavily Results

export const webSearchStep = RunnableLambda.from(
  async (input: { query: string; mode: AgentMode }) => {
    const results = await webSearch(input.query);
    return {
      ...input,
      results,
    };
  },
);

// Step 2 - Open the pages and summarize the content within

export const openAndSummarizeStep = RunnableLambda.from(
  async (input: { query: string; mode: AgentMode; results: any[] }) => {
    if (!Array.isArray(input.results) || input.results.length === 0) {
      return {
        ...input,
        pageSummaries: [],
        fallback: "no-results" as const,
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
        fallback: "snippets" as const,
      };
    }

    return {
      ...input,
      pageSummaries,
      fallback: "none" as const,
    };
  },
);

// Step 3 - Composes answers from summaries or directly asks llm in case no web search results were found

export const synthesizeResponseStep = RunnableLambda.from(
  async (input: {
    query: string;
    pageSummaries: Array<{
      url: string;
      summary: string;
    }>;
    mode: AgentMode;
    fallback: "no-results" | "snippets" | "none";
  }): Promise<Candidate> => {
    const model = makeModel({ temperature: 0.3 });

    // If tavily query fails, get direct answer from model
    if (!input.pageSummaries || input.pageSummaries.length === 0) {
      const directResponseFromModel = await model.invoke([
        new SystemMessage(
          [
            "You are a highly precise research assistant.",
            "The search engine returned no results for this query.",
            "Answer based ONLY on your internal knowledge.",
            "If you are not 100% certain of the facts, explicitly state that no search results were found and you cannot provide a verified answer.",
            "Be concise, professional, and do not speculate.",
          ].join("\n"),
        ),
        new HumanMessage(input.query),
      ]);

      const directAnswer = (
        typeof directResponseFromModel.content === "string"
          ? directResponseFromModel.content
          : String(directResponseFromModel.content)
      ).trim();

      return {
        answer: directAnswer,
        sources: [],
        mode: "direct",
      };
    }

    const res = await model.invoke([
      new SystemMessage(
        [
          "You are a helpful research/knowledge-base assistant that answers questions using the provided page summaries.",
          "Rules:",
          "- Be accurate, objective, and neutral.",
          "- Your response must be between 5-8 sentences.",
          "- Contextual Grounding: Use ONLY the provided summaries to answer.",
          "- Integrity: If the summaries do not contain the answer, state that the information is not available in the search results. Do not invent facts.",
        ].join("\n"),
      ),
      new HumanMessage(
        `
        Question: ${input.query}
        Summaries: ${JSON.stringify(input.pageSummaries, null, 4)}
        `,
      ),
    ]);

    const answer = (
      typeof res.content === "string" ? res.content : String(res.content)
    ).trim();

    const sources = input.pageSummaries.map(x => x.url);

    return {
      answer,
      sources,
      mode: "web",
    };
  },
);

// Final: Sequence pipeline with input/output from each step
export const webPipeline = RunnableSequence.from([
  webSearchStep,
  openAndSummarizeStep,
  synthesizeResponseStep,
]);
