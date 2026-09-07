# PLAN

## Goal
Ship a single-user fun AI mood board that demos CopilotKit generative UI: a chat/copilot sidebar that can create styled vibe cards on a canvas.

## Single-user MVP
- Canvas of mood cards (title, short blurb, emoji, color accent)
- CopilotKit chat sidebar that can add/update cards via generative UI or tool/actions
- At least one scripted happy path: ask for a vibe → card appears on canvas
- Works with `bun install && bun run dev` from apps/copilotkit-moodboard/
- If an LLM API key is missing, degrade gracefully with a clear mock/demo mode so the UI is still demoable (document required env in README)

## Explicitly out of scope
- Auth, multi-user, persistence beyond local/session, production deploy, voice, mobile polish

## Outcome-oriented tasks
1. Write PLAN.md verbatim.
2. Scaffold via official Bun-friendly create-* (prefer bunx create-next-app or documented CopilotKit starter) under apps/copilotkit-moodboard/. Prefer skip-install flags, then add bunfig.toml with `[install] minimumReleaseAge = 259200` BEFORE bun install.
3. Wire CopilotKit (latest docs) with minimalist UI (shadcn ok if it helps).
4. Implement canvas + AI-driven card creation as vertical slices until happy path works.
5. PR validation: at least ONE screenshot AND at least ONE video/mp4 of the running app in the PR body (hosted artifacts — do not commit media into the branch).

## Stack
- Bun
- CopilotKit (the tech under demo)
- Next.js or official CopilotKit-recommended React scaffold
- Mock/demo LLM mode when no key

## Deferred
- Auth, durable DB, Cloudflare Pages wiring, voice
