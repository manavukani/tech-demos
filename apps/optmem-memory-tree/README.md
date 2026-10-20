# optmem-memory-tree

A one-screen visualisation of [OptMem](https://github.com/VictorTaelin/OptMem): an
append-only log of one-line notes, folded into a binary tree of one-line summaries, read
back within a token budget. Nothing leaves the page — the merges come from a
deterministic local stub, so there is no API key and no network call. See
[PLAN.md](./PLAN.md) for scope.

## Run

```bash
bun install
bun run dev      # http://localhost:3002
bun test         # the memory model
```

## What you can do with it

- **Write notes.** One line, 280 bytes, appended and never edited. The byte counter is in
  front of you while you type, because a note that does not fit has to be compressed by
  whoever wrote it.
- **Watch the tree build.** Notes pair into `#0-1`, `#2-3`, those pair into `#0-3`, and so
  on. Merges come due one at a time and are applied on a timer, so the tree visibly folds
  as the log grows. Pause it and step through merges by hand.
- **Move the reading budget.** `wake` is the document a session is handed: recent notes
  verbatim, older stretches as one line each. The slider changes the resolution of the
  same log, and the tree highlights exactly which nodes the current budget is reading.
- **Zoom.** Click a node, or a line in the wake document, to open it into its two halves,
  down to raw notes. `forget` drops a summary and everything built on it; the next merge
  rebuilds it from the log.
- **Recall.** A regex over every note ever written, matches highlighted. It reads the log,
  never a summary.

## Layout

| Path | What it is |
| --- | --- |
| `src/memory/blocks.ts` | Block arithmetic and `cover` — which nodes a budget reads |
| `src/memory/store.ts` | The log, the summary levels, pending merges, `zoom`, `forget` |
| `src/memory/wake.ts` | The wake document and the token budget that sizes it |
| `src/memory/recall.ts` | Regex search over the log, with match spans for highlighting |
| `src/memory/summarize.ts` | The deterministic merge stub |
| `src/memory/seed.ts` | 32 sample notes — exactly four levels of merges |
| `src/hooks/use-memory.ts` | App state, localStorage, and the merge queue draining |
| `src/components/` | Tree, log, and the wake / zoom / recall panels |

The model in `src/memory/` is plain TypeScript with no React in it, and it carries the
tests (`bun test`, 56 of them). `cover` is the one piece worth reading twice: it tiles the
log with aligned power-of-two blocks, keeping a block whole only while its size stays
within a fraction of its age, so detail decays with age and the newest notes are the last
to collapse.

## How faithful is it

The log, the block shape, the merge order, the cover, `wake`, `zoom`, `recall` and
`forget` follow upstream's behaviour, including refusing to wake when the document needs a
summary that does not exist yet. What differs:

- **Summaries.** Upstream hands each merge to the model that owns the memory. Here a local
  stub keeps the most salient line of what it merges and tags it with the words that
  carried it. It is extractive, so it invents nothing — and it cannot judge what had
  lasting effect, which is the part a model is for.
- **Storage.** Upstream keeps fixed-width records in `~/.optmem/memory` so that position
  is identity and every lookup is one seek. Here the log lives in `localStorage`, indexed
  by position for the same reason, minus the seeking.
- **Timing.** Upstream never runs anything in the background: merges arrive in the output
  of `note` and the agent answers them. This app drains the same queue on a timer so the
  tree can be watched, and the pause button puts you back in upstream's position.

## Note on Bun versions

In this monorepo, `bun install` from an app directory hangs with Bun 1.4.3 — for every
app, not just this one. Bun 1.2.21 installs it in seconds. If an install stalls at
`Resolved, downloaded and extracted`, that is the one to use.
