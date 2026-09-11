# PLAN

## Goal
Ship a single-user Papra-inspired inbox: drag-drop documents, extract searchable text, tag and full-text find.

## Single-user MVP
- Drag-drop (and file picker) for PDFs/images/text files
- Store docs locally for the session (or local JSON + files under a gitignored data dir)
- Extract text: PDF text layer and/or simple OCR path for images where feasible in Bun/browser; degrade gracefully with a clear “text unavailable” state
- Tags + full-text search across extracted content
- List/detail UI; `bun install && bun run dev` from apps/papra-inbox/

## Explicitly out of scope
- Forking Papra, AGPL code reuse, email-in ingestion, multi-user/auth, production self-host packaging, Cloudflare deploy

## Outcome-oriented tasks
1. Write PLAN.md verbatim.
2. Scaffold with Bun-friendly create-* under apps/papra-inbox/; skip-install preferred; bunfig.toml with `[install] minimumReleaseAge = 259200` BEFORE bun install.
3. Minimalist shadcn/ui only as needed.
4. Implement upload → extract → tag → search as vertical slices until happy path works.
5. PR validation: at least ONE screenshot AND at least ONE video/mp4 of the running app in the PR body (hosted artifacts — do not commit media).

## Stack
- Bun
- Next.js or Vite React
- Client-side or light server extraction libraries (prefer well-documented, boring defaults)
- Local-only persistence for MVP

## Deferred
- Email-in, cloud storage, multi-user, AGPL Papra integration
