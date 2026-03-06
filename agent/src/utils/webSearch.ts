import { env } from "../shared/env.js";
import {
  WebSearchResults,
  WebSearchResultsSchema,
  WebSearchResultSchema,
} from "./schema.js";

export async function webSearch(q: string) {
  const query = (q ?? "").trim();
  if (!query) return [];

  return await searchTavilyUtil(query);
}

async function searchTavilyUtil(query: string): Promise<WebSearchResults> {
  if (!env.TAVILY_API_KEY) {
    throw new Error("Tavily API key is missing!!!");
  }
  query = query.length < 400 ? query : query.slice(0, 400);
  const response = await fetch(`https://api.tavily.com/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
      include_images: false,
    }),
  });

  if (!response.ok) {
    const text = await safeText(response);
    console.error(JSON.stringify(text, null, 4) as any);
    throw new Error(
      `Tavily error: ${response.status} ${response.statusText}\n${(text as any).detail.error as string}`,
    );
  }
  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  const normalized = results.slice(0, 5).map((r: any) =>
    WebSearchResultSchema.parse({
      title: String(r?.title ?? "").trim() || "Untitled",
      url: String(r?.url ?? "").trim(),
      snippet: String(r?.content ?? "")
        .trim()
        .slice(0, 220),
    }),
  );

  return WebSearchResultsSchema.parse(normalized);
}

async function safeText(res: Response) {
  try {
    return await res.json();
  } catch (e) {
    return "<no response body>";
  }
}
