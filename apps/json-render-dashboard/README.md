# json-render-dashboard — prompt → UI

Single-user demo of [json-render](https://json-render.dev/) (Vercel Labs). You type a prompt, a generator streams catalog-constrained JSON patches (SpecStream JSONL), and a mini dashboard renders progressively from real React components. See [PLAN.md](./PLAN.md) for scope.

## Run

```bash
bun install
`bun run dev`      # http://localhost:3000
```

No API key is required. With none set the app runs in **mock mode** (badge: `Mock mode · scripted generator`): a scripted generator stands in for the LLM and emits the same JSONL patch stream a model would. Try:

- "Show me a Q3 revenue dashboard for the online store"
- "Product growth: users, signups, churn"
- "Platform health for the API cluster"
- "Sales by region with a pie chart" — the catalog has no pie chart; the generator stays inside the guardrails and says so

## Live mode (optional)

Copy `.env.example` to `.env.local` and set **one** key, then restart `bun run dev`. The badge switches to `Live · <model>`.

| Env var              | Generator                                                         |
| -------------------- | ----------------------------------------------------------------- |
| `OPENAI_API_KEY`     | OpenAI via `@ai-sdk/openai` (model id from `JSON_RENDER_MODEL`, default `gpt-4o-mini`) |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway (`JSON_RENDER_MODEL` as `provider/model`, default `anthropic/claude-haiku-4.5`) |

In live mode the system prompt is `catalog.prompt()` plus a few layout rules (see the route), so the model can only use the six catalog components.

## What's in it

- `src/lib/catalog.ts` — the guardrail. `defineCatalog` with six components (`Dashboard`, `Heading`, `Text`, `MetricCard`, `BarChart`, `List`) and Zod prop schemas. `validateSpec()` runs `catalog.validate()` (structure + allowed types) and then each component's prop schema.
- `src/lib/registry.tsx` — `defineRegistry` mapping catalog types to Tailwind-styled React components. `BarChart` is CSS bars; no chart library.
- `src/lib/mock-generator.ts` — the scripted generator. Picks a scenario from the prompt (revenue / growth / platform health / generic), builds RFC 6902 patches, validates the assembled spec against the catalog, then streams the lines with small delays. The chart's `data` array grows across several `replace` patches so you can watch bars appear.
- `src/app/api/generate/route.ts` — `POST /api/generate`. Mock stream when no key; otherwise `streamText()` from the AI SDK with `catalog.prompt()` as the system prompt, returned via `toTextStreamResponse()`.
- `src/components/dashboard-studio.tsx` — the page. `useUIStream` drives generation; `<Renderer>` inside `StateProvider`/`VisibilityProvider` renders the spec as patches land. The side panel lists the catalog (with per-type usage counts), the generated system prompt, and the raw JSONL patch log.
- `bunfig.toml` — `[install] minimumReleaseAge = 259200`, written before the first install.

Scaffolded with `bunx create-next-app@latest json-render-dashboard --ts --tailwind --eslint --app --src-dir --use-bun --skip-install --disable-git --yes`.

Note on installs: the repo root declares `apps/*` as Bun workspaces, so `bun install` run inside this directory resolves through the root lockfile and the root has no `bunfig.toml`. The committed `bun.lock` here was generated standalone with this app's `bunfig.toml` applied; to get the same pin when installing through the workspace root, run `bun install --minimum-release-age=259200`.
