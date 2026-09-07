# project-planning

Planning rules for new demo apps. Read this before scaffolding anything under `apps/`.

1. Write `apps/<slug>/PLAN.md` **before** writing code. Sections, in order: Goal, Single-user MVP, Explicitly out of scope, Outcome-oriented tasks, Stack (rationale), Deferred.
2. Scope to a single-user MVP that runs locally with `bun install && bun run dev`.
3. Prefer the official scaffold for the tech under demo. Prefer flags that skip the initial install so `bunfig.toml` can be set first.
4. Implement as vertical slices until the happy path works end-to-end; stop there.
5. Record the pick in `tracking/seen-bookmarks.json` and move it from `proposed` to `built` when the PR merges.
6. Repo-wide rules live in the root `AGENTS.md`.
