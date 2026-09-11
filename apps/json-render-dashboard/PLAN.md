# PLAN

## Goal
Ship a single-user prompt→UI demo of json-render: user types a prompt, a generator streams catalog-constrained JSON, and a mini dashboard renders progressively.

## Single-user MVP
- Small component catalog (e.g. MetricCard, Chart/List, Text/Heading — keep it tiny)
- Prompt input that triggers generation
- Progressive render of the streamed JSON into real React components via @json-render/*
- Mock/scripted generator when no LLM API key is present (still demos streaming + catalog guardrails); document env vars for live mode
- `bun install && bun run dev` works from apps/json-render-dashboard/

## Explicitly out of scope
- Auth, multi-user, remotion/r3f/email packages, production deploy, full 36-component shadcn catalog

## Outcome-oriented tasks
1. Write PLAN.md verbatim.
2. Scaffold with Bun-friendly create-* (create-next-app or create-vite) under apps/json-render-dashboard/; skip-install flags preferred; create bunfig.toml with `[install] minimumReleaseAge = 259200` BEFORE bun install.
3. Wire @json-render/core + @json-render/react (and shadcn pieces only as needed) per current docs at https://json-render.dev/
4. Implement catalog + prompt + stream/render happy path; mock mode without keys.
5. PR validation: at least ONE screenshot AND at least ONE video/mp4 of the running app in the PR body (hosted artifacts — do not commit media).

## Stack
- Bun
- json-render (the tech under demo)
- Next.js or Vite React
- Mock generator fallback

## Deferred
- Live multi-model routing, remotion/r3f renderers, Cloudflare Pages path deploy
