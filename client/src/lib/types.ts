export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  mode?: "web" | "direct";
  time?: number;
};
