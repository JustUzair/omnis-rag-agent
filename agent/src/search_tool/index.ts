import { RunnableBranch, RunnableSequence } from "@langchain/core/runnables";
import { AgentMode } from "./types.js";
import { directPath as directPipeline } from "./pipelines/direct.js";
import { webPipeline } from "./pipelines/web.js";
import { routeStep } from "./routeStrategy.js";
import { finalValidateAndPolish } from "./validate.js";
import { SearchInput } from "../utils/schema.js";

const branch = RunnableBranch.from<
  {
    query: string;
    mode: AgentMode;
  },
  any
>([[input => input.mode === "web", webPipeline], directPipeline]);

export const searchChain = RunnableSequence.from([
  routeStep,
  branch,
  finalValidateAndPolish,
]);

export async function runSearch(input: SearchInput) {
  return await searchChain.invoke(input);
}
