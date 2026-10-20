# OptMem Memory Tree — PLAN

**Goal:** A single-user Bun web app that visualizes how [OptMem](https://github.com/VictorTaelin/OptMem) works: an append-only log of one-line notes folded into a binary tree of one-line summaries, with wake / zoom / recall views.

## MVP scope
- Note input: append one-line notes to a log (persisted in localStorage).
- Live summary tree: pairs merge into #0-1, #2-3, then #0-3, etc., animated as notes arrive.
- `wake` view: what an agent would receive within an adjustable token budget (top summaries + recent raw notes).
- `zoom`: click any node to drill down to its children and raw notes.
- `recall`: regex search over all raw notes with matches highlighted.
- Merge summaries from a deterministic local stub (no API key). Seed button with sample notes.
- Short "How OptMem works" explainer panel, original wording, linking upstream.

## Out of scope
Real LLM summarization, multi-user, backend/DB, running the upstream Python script, auth.

## Tasks (vertical slices)
1. Scaffold (bunx create-vite react-ts), bunfig.toml with `[install] minimumReleaseAge = 259200`, shadcn/ui minimalist preset.
2. Core memory model in `src/memory/` (log, tree build, wake budget, zoom, recall) + unit tests (bun test).
3. Log + tree UI with merge animation.
4. Wake / zoom / recall panels.
5. Explainer + seed data, README.
6. Validate in browser; capture screenshot + video into the PR.

## Stack
- Vite + React + TS: one-screen tool, no framework needed.
- shadcn/ui + Tailwind: minimal defaults.
- Bun: runtime, PM, tests.

## Deferred
Optional real LLM summarizer behind a key; import/export of OptMem log files.

## Hard constraints
Only touch `apps/optmem-memory-tree/`. `bun install && bun run dev` must work. One PR with ≥1 screenshot and ≥1 video of the running app. Never create a new repo.
