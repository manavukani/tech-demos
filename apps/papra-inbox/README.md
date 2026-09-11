# papra-inbox

A single-user document inbox inspired by [Papra](https://papra.app): drop PDFs, images and text files, get their text extracted in the browser, tag them, and find them again with full-text search. Original MVP — no Papra code is used.

```bash
cd apps/papra-inbox
bun install && bun run dev   # http://localhost:5173
```

Click **Add sample documents** for a lease PDF, an electricity bill PDF, a receipt image (OCR) and a markdown note, or drop your own files anywhere on the page.

## What it does

| Input | Extraction path | Status shown |
| --- | --- | --- |
| PDF with a text layer | `pdfjs-dist` text content, page by page | "Text layer extracted from N pages." |
| Scanned / image-only PDF | Render first 3 pages to canvas, OCR with `tesseract.js` | "No text layer; OCR'd." |
| PNG / JPG / other images | `tesseract.js` OCR (English) | "OCR (Tesseract, English)." |
| `.txt`, `.md`, `.csv`, `.json`, … | Read as text | "Read as plain text." |
| Anything else | Kept, but no text | "Text unavailable" — still searchable by name and tags |

- **Search** (`minisearch`) covers file name, tags and extracted text, with prefix + light fuzzy matching, ranked results, snippets and highlights in the detail view.
- **Tags** are edited inline; existing tags are offered for reuse and double as filters in the sidebar.
- **Storage** is IndexedDB (`idb-keyval`), file bytes included. Nothing leaves the browser; reload and the inbox is still there. Extraction runs sequentially in a queue and resumes for anything left pending.
- Tesseract's worker, WASM core and `eng` language data are fetched on first OCR from tesseract.js's default CDN (jsDelivr / tessdata.projectnaptha.com) and cached by the browser.

## Stack

Bun · Vite 8 · React 19 · Tailwind v4 · shadcn/ui (base-nova: button, input, badge, card, empty, spinner, separator, scroll-area) · `pdfjs-dist` · `tesseract.js` · `minisearch` · `idb-keyval`

## Layout

```
src/
  App.tsx                      layout, search + tag filters, drag-drop overlay
  hooks/use-inbox.ts           documents state, IndexedDB sync, extraction queue
  hooks/use-object-url.ts      blob URL lifecycle for previews
  lib/extract.ts               PDF text layer → OCR fallback, image OCR, plain text
  lib/search.ts                MiniSearch index, snippets, highlight segments
  lib/store.ts                 idb-keyval persistence
  lib/samples.ts               generated sample docs (hand-built PDF, canvas receipt)
  components/                  document list, detail, tag editor, drop zone, badges
```

## Out of scope (see PLAN.md)

Email-in ingestion, multi-user/auth, server-side storage, production packaging, any AGPL Papra code.

## Install note

The repo root declares `apps/*` as Bun workspaces, so `bun install` here resolves through the root. The committed `bun.lock` was generated standalone with this app's `bunfig.toml` (`minimumReleaseAge = 259200`) applied. `vite` is pinned to `^8.2.2` because 8.3.0 was younger than the freshness window at install time.
