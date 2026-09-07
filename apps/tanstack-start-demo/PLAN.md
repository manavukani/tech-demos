# PLAN

## Goal
Ship a single-user “link dump” web app that demos TanStack Start: add, list, and filter saved URLs with SSR + client interactivity.

## Single-user MVP
- Add a link (title + URL)
- List links on an SSR page
- Client-side text filter
- Persist in-memory or local file/JSON for the session (no auth, no multi-user)
- `bun install && bun run dev` works from apps/tanstack-start-demo/

## Explicitly out of scope
- Auth, accounts, sharing, tags, folders, browser extension, cloud DB, Cloudflare deploy wiring beyond what’s needed to run locally

## Outcome-oriented tasks
1. Bootstrap monorepo root if missing: AGENTS.md (short rules: Bun, one app per apps/<slug>/, PRs need screenshot+video, cloud agents prefer apps/ only), tracking/seen-bookmarks.json with proposed TanStack Start entry, skills/project-planning/ README stub pointing at planning rules.
2. Scaffold apps/tanstack-start-demo/ via official `bunx create-tanstack` (or documented TanStack Start starter). Prefer flags that skip initial install.
3. Before any install: ensure apps/tanstack-start-demo/bunfig.toml has `[install] minimumReleaseAge = 259200`, then `bun install`.
4. Add minimalist shadcn/ui; pull only Input, Button, Card (or equivalent) as needed.
5. Implement add + list + filter as vertical slices until the happy path works end-to-end.
6. Attach validation artifacts to the PR (not committed into the branch): at least ONE screenshot AND at least ONE video/mp4 of the running app.

## Stack (rationale)
- Bun — runtime, package manager, scripts
- TanStack Start — the tech under demo; official scaffold
- shadcn/ui (minimalist) — fast, boring UI defaults
- In-memory or local JSON store — enough for single-user MVP

## Deferred
- Durable DB, auth, Cloudflare Pages path deploy, folders/tags
