import { RunnableLambda } from "@langchain/core/runnables";
import { Candidate } from "./types.js";
import { SearchAnswer, SearchAnswerSchema } from "../utils/schema.js";
import { makeModel } from "../shared/models.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const finalValidateAndPolish = RunnableLambda.from(
  async (candidate: Candidate) => {
    const finalDraft = {
      answer: candidate.answer,
      sources: candidate.sources ?? [],
    };

    const parsed = SearchAnswerSchema.safeParse(finalDraft);
    if (parsed.success) return parsed.data;

    const fixed = await repairSearchAns(finalDraft);

    return SearchAnswerSchema.safeParse(fixed).data;
  },
);

async function repairSearchAns(obj: any): Promise<SearchAnswer> {
  const model = makeModel({ temperature: 0.3 });
  const response = await model.invoke([
    new SystemMessage(
      [
        "You are a strict JSON repair utility.",
        "Your ONLY output must be a single, valid JSON object that adheres to the provided schema.",
        "Do not include any preamble, explanations, or markdown code blocks (e.g., no ```json).",
        'Schema: { "answer": string, "sources": string[] }',
        "Constraint: 'sources' must be an array of valid URL strings.",
      ].join("\n"),
    ),
    new HumanMessage(
      [
        "Repair and reformat the following input to match the schema exactly.",
        "Input to fix:",
        JSON.stringify(obj),
      ].join("\n\n"),
    ),
  ]);

  const text =
    typeof response.content === "string"
      ? response.content
      : String(response.content);
  const json = extractJson(text);

  return SearchAnswerSchema.parse({
    answer: String(json?.answer ?? "").trim(),
    sources: Array.isArray(json?.sources) ? json?.sources?.map(String) : [],
  });
}

function extractJson(input: string) {
  const start = input.indexOf("{");
  const end = input.indexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};

  try {
    return JSON.parse(input.slice(start, end + 1));
  } catch {
    return {};
  }
}
