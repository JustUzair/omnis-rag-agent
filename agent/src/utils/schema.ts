import { z } from "zod";

export const WebSearchResultSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  snippet: z.string().optional().default(""),
});

export const WebSearchResultsSchema = z.array(WebSearchResultSchema).max(10);

export type WebSearchResults = z.infer<typeof WebSearchResultsSchema>;

export const OpenURLInputSchema = z.object({
  url: z.url(),
});

export const OpenURLOutputSchema = z.object({
  url: z.url(),
  content: z.string().min(1),
});

export const SummarizeInputSchema = z.object({
  text: z.string().min(50, "Need more text to summarize"),
});

export const SummarizeOutputSchema = z.object({
  summary: z.string().min(1),
});

export const SearchInputSchema = z.object({
  query: z.string().min(5, "Please input a query..."),
});

export type SearchInput = z.infer<typeof SearchInputSchema>;

export const SearchAnswerSchema = z.object({
  answer: z.string().min(1),
  sources: z.array(z.url()).default([]),
});

export type SearchAnswer = z.infer<typeof SearchAnswerSchema>;
