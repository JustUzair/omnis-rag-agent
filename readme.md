<div align="center">

```
           ██████╗ ███╗   ███╗███╗   ██╗██╗███████╗
           ██╔═══██╗████╗ ████║████╗  ██║██║██╔════╝
           ██║   ██║██╔████╔██║██╔██╗ ██║██║███████╗
           ██║   ██║██║╚██╔╝██║██║╚██╗██║██║╚════██║
           ╚██████╔╝██║ ╚═╝ ██║██║ ╚████║██║███████║
            ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝╚══════╝
```

**Intelligence + Web Synthesis Engine**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![LangChain](https://img.shields.io/badge/LangChain-LCEL-1C3C3C?style=flat-square&logo=chainlink&logoColor=white)](https://js.langchain.com/)
[![Zod](https://img.shields.io/badge/Zod-4.x-3E67B1?style=flat-square)](https://zod.dev/)
[![Tavily](https://img.shields.io/badge/Tavily-Search_API-FF6B35?style=flat-square)](https://tavily.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![License](https://img.shields.io/badge/License-ISC-green?style=flat-square)](LICENSE)

<br/>

**[Live Demo →](https://omnis-ai-justuzair.vercel.app)**

</div>

---

## What is OMNIS?

OMNIS is an AI-powered search agent that decides, on its own, whether your question needs a live web search or can be answered directly from the model's knowledge. You ask a question, and the system figures out the rest.

Under the hood it's a **Retrieval-Augmented Generation (RAG) pipeline** built on LangChain Expression Language (LCEL). Two execution paths exist: one that hits the web in real time, scrapes and summarizes sources, then synthesizes a cited answer; and one that goes straight to the LLM when the query is clearly a knowledge question that doesn't need current data.

The frontend is a Next.js app with a dark industrial aesthetic, heavy motion, 3D tilt cards, per-word answer reveals, and a real-time mouse spotlight. The backend is an Express.js server deployed to Vercel as a serverless function.

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                  Next.js App (Vercel)                           │
│         POST /api/search → Next.js API Route (proxy)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ x-api-key (server-side only)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND                             │
│                   (Vercel Serverless)                           │
│                                                                 │
│   Rate Limiter (10 req / 10 min)  ──→  CORS  ──→  Controller    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    Input Validation    │
              │       (Zod)            │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │     Route Strategy     │
              │   Pattern Detection    │
              └─────┬──────────┬───────┘
                    │          │
           Web Mode │          │ Direct Mode
                    ▼          ▼
          ┌──────────────┐  ┌──────────────┐
          │ WEB PIPELINE │  │DIRECT PIPELINE│
          └──────┬───────┘  └──────┬────────┘
                 │                 │
                 ▼                 ▼
    ┌────────────────────┐    ┌───────────────────┐
    │ 1. Tavily Search   │    │  LLM Direct Call  │
    │ 2. Fetch & Scrape  │    │  (no web, purely  │
    │ 3. LLM Summarize   │    │  model knowledge) │
    │ 4. LLM Synthesize  │    └───────────────────┘
    └────────────────────┘
                 │                 │
                 └────────┬────────┘
                          ▼
              ┌────────────────────────┐
              │  Final Validation &    │
              │  Schema Polish         │
              └────────────┬───────────┘
                           ▼
              { answer, sources[], mode }
```

### Request Routing Logic

The router inspects the raw query string before any LLM is called and makes a binary decision:

```
Query Received
     │
     ├── Contains "latest", "today", "now", "news", "trending"  → WEB
     ├── Contains year reference 2024, 2025, 2026+              → WEB
     ├── Contains "top 10", "best", "vs", "compare"             → WEB
     ├── Contains "price", "cost", "how much"                   → WEB
     ├── Contains "review", "rating", "tutorial", "how to"      → WEB
     ├── Contains a URL                                         → WEB
     │
     └── None of the above                                      → DIRECT
```

No LLM is used to make the routing decision, it's pure regex/keyword pattern matching, which keeps it fast and deterministic.

### Web Pipeline, Step by Step

```
Query
  │
  ▼
┌─────────────────────────────────────────┐
│  STEP 1, Tavily Search                  │
│  Searches the web, returns top 5        │
│  results: title, URL, snippet           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  STEP 2, Open & Fetch                   │
│  Visits each URL, scrapes HTML,         │
│  converts to plain text via             │
│  html-to-text. If a page fails to       │
│  load, falls back to the Tavily snippet │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  STEP 3, Summarize                      │
│  Each page's raw text is individually   │
│  summarized by the LLM into 5-8         │
│  sentences. Temperature: 0.4            │
│  Focus: key facts, no fluff             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  STEP 4, Synthesize                     │
│  All summaries are passed together to   │
│  the LLM with the original query. The   │
│  LLM composes a single cohesive answer  │
│  sourced ONLY from the summaries.       │
│  Returns: answer + source URLs          │
└─────────────────────────────────────────┘
```

---

## Project Structure

```
omnis/
├── agent/                          # Express backend
│   ├── src/
│   │   ├── index.ts                # Server entry, Express setup, routes, CORS, rate limiting
│   │   ├── controllers/
│   │   │   └── search_lcel.ts      # Request handler, validates input, calls search chain
│   │   ├── routes/
│   │   │   └── search_lcel.ts      # POST /api/v1/search route definition
│   │   ├── search_tool/
│   │   │   ├── index.ts            # LCEL chain orchestrator, branches to web or direct
│   │   │   ├── routeStrategy.ts    # Pattern-based query router
│   │   │   ├── types.ts            # Shared TypeScript types
│   │   │   ├── validate.ts         # Final output validation and polishing
│   │   │   └── pipelines/
│   │   │       ├── web.ts          # 4-step web pipeline (search → fetch → summarize → synthesize)
│   │   │       └── direct.ts       # Single-step direct LLM pipeline
│   │   ├── shared/
│   │   │   ├── env.ts              # Zod-validated environment config
│   │   │   └── models.ts           # makeModel() factory, returns LLM instance by provider
│   │   └── utils/
│   │       ├── webSearch.ts        # Tavily API client
│   │       ├── openUrl.ts          # HTML fetcher + text extractor
│   │       ├── summarize.ts        # LLM summarization utility
│   │       └── schema.ts           # Zod schemas, SearchInput, SearchOutput
│   ├── tsup.config.ts              # Bundle config (ESM, single file, treeshaken)
│   ├── vercel.json                 # Vercel serverless function config
│   └── package.json
│
└── client/                         # Next.js frontend
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx            # Main chat UI
    │   │   ├── api/
    │   │   │   └── search/
    │   │   │       └── route.ts    # Next.js proxy route (keeps API secret server-side)
    │   │   └── layout.tsx
    │   ├── components/ui/          # shadcn/ui primitives
    │   └── lib/
    │       ├── config.ts           # API_URL constant
    │       └── utils.ts
    └── package.json
```

---

## Tech Stack

| Layer              | Technology                        | Purpose                                     |
| ------------------ | --------------------------------- | ------------------------------------------- |
| Frontend Framework | Next.js 16                        | React app + API proxy routes                |
| UI Animations      | Framer Motion                     | Page transitions, 3D tilt, word reveals     |
| Backend Framework  | Express.js                        | HTTP server, routing, middleware            |
| AI Chain Framework | LangChain LCEL                    | Pipeline composition and branching          |
| Web Search         | Tavily Search API                 | Real-time web results                       |
| HTML Extraction    | html-to-text                      | Converts scraped pages to LLM-readable text |
| LLM Providers      | OpenAI / Gemini / Groq / Deepseek | Pluggable, set via env var                  |
| Validation         | Zod                               | Input/output schema enforcement             |
| Language           | TypeScript                        | Full stack                                  |
| Build Tool         | tsup                              | Fast ESM bundling with treeshaking          |
| Deployment         | Vercel                            | Frontend + backend both on Vercel           |

---

## LLM Providers

The backend is provider-agnostic. Set `MODEL_PROVIDER` in your environment to switch:

| Provider           | Env Key Required   |
| ------------------ | ------------------ |
| `gemini` (default) | `GEMINI_API_KEY`   |
| `openai`           | `OPENAI_API_KEY`   |
| `groq`             | `GROQ_API_KEY`     |
| `deepseek`         | `DEEPSEEK_API_KEY` |

Optionally set `OPENAI_MODEL`, `GEMINI_MODEL`, etc. to pin a specific model version. If not set, the factory uses the provider's default.

The same `MODEL_PROVIDER` config applies to all three LLM calls in the web pipeline (summarize per page, synthesize final answer) and the single call in direct mode. Set `RAG_MODEL_PROVIDER` separately if you want a different model handling the RAG synthesis step.

---

## Running Locally

**Backend**

```bash
cd agent
yarn install
yarn dev
```

**Frontend**

```bash
cd client
yarn install
yarn dev
```


---

## API

### `POST /api/v1/search`

**Request**

```json
{
  "query": "string (min 5 characters)"
}
```

**Response**

```json
{
  "answer": "Synthesized response text...",
  "sources": ["https://...", "https://..."],
  "mode": "web" | "direct"
}
```

`sources` is an empty array when `mode` is `"direct"`.

### `GET /status`

Returns server health. No auth required.

```json
{
  "status": "ok",
  "timestamp": "28/02/2026, 9:41:00 am"
}
```

---

<div align="center">

Built by **[justuzair](https://github.com/justuzair)**

</div>
