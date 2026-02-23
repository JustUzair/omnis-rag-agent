/* Agent Paths: 
    1. Web >>> Browse, Summarize, source/cite urls
    2. Direct >>> Ask AI Model
*/

export type AgentMode = "web" | "direct";
export type Candidate = {
  answer: string;
  sources: string[];
  mode: AgentMode;
};
