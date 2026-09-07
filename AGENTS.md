# AGENTS.md

Rules for humans and agents working in this monorepo.

- **Bun** is the runtime, package manager, and script runner. No npm/pnpm/yarn lockfiles.
- **One app per `apps/<slug>/`.** Each app is self-contained: its own `package.json`, `bunfig.toml`, and scripts. `bun install && bun run dev` must work from inside the app directory.
- **Every app starts with `apps/<slug>/PLAN.md`** written before any code. See `skills/project-planning/`.
- **PRs need a screenshot and a video** of the running app, hosted in the PR body. Never commit media into the branch.
- **Cloud agents: stay inside `apps/`.** Root files (`AGENTS.md`, `tracking/`, `skills/`) are only touched for monorepo bootstrap or tracking updates. Do not sprawl.
- **Never create a new GitHub repository.** All demos live here.
- Pin freshness: every app's `bunfig.toml` sets `[install] minimumReleaseAge = 259200` before the first install.
- Track picks in `tracking/seen-bookmarks.json` (`proposed` -> `built`).
