import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { AgentMode, Candidate } from "../types.js";
import { makeModel } from "../../shared/models.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const directPath = RunnableLambda.from(
  async (input: { query: string; mode: AgentMode }): Promise<Candidate> => {
    const model = makeModel({ temperature: 0.3 });
    const res = await model.invoke([
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
      typeof res.content === "string" ? res.content : String(res.content)
    ).trim();

    return {
      answer: directAnswer,
      sources: [],
      mode: "direct",
    };
  },
);
