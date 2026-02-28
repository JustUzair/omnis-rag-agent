import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  MODEL_PROVIDER: z
    .enum(["gemini", "openai", "groq", "deepseek"])
    .default("gemini"),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().min(1),
  PORT: z.string().min(1),
  ALLOWED_ORIGIN: z.string().min(1),
  OPENAI_MODEL: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  DEEPSEEK_MODEL: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  SEARCH_PROVIDER: z.enum(["tavily", "google"]).default("tavily"),
  RAG_MODEL_PROVIDER: z
    .enum(["gemini", "openai", "groq", "deepseek"])
    .default("gemini"),
});

export const env = EnvSchema.parse(process.env);
