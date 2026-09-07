# copilotkit-moodboard — AI mood board

Single-user "AI mood board" demo of [CopilotKit](https://www.copilotkit.ai/) generative UI: a `CopilotSidebar` copilot that pins styled vibe cards (title, blurb, emoji, accent color) onto a canvas by calling frontend tools. See [PLAN.md](./PLAN.md) for scope.

## Run

```bash
bun install
bun run dev      # http://localhost:3000
```

No API key is required. With none set the app runs in **demo mode**: a scripted agent stands in for the LLM and the header shows a `Demo mode · scripted agent` badge. Try:

- "Give me a cozy rainy-day vibe"
- "Pin three summer vibes"
- "Make the last card purple" / "rename the summer card to Beach Bum Season"
- "clear the board"

## Live mode (optional)

Copy `.env.example` to `.env.local` and set **one** provider key. The runtime picks the model automatically:

| Env var             | Model used                    |
| ------------------- | ----------------------------- |
| `OPENAI_API_KEY`    | `openai/gpt-4o-mini`          |
| `ANTHROPIC_API_KEY` | `anthropic/claude-haiku-4-5`  |
| `GOOGLE_API_KEY`    | `google/gemini-2.5-flash`     |
| `MOODBOARD_MODEL`   | override with any `provider/model` string CopilotKit's `BuiltInAgent` accepts |

Restart `bun run dev` after changing env. The badge switches to `Live · <model>`.

## What's in it

- `src/app/api/copilotkit/[[...slug]]/route.ts` — CopilotKit runtime (`@copilotkit/runtime/v2`). Registers a `BuiltInAgent`: classic mode on a real model when a key exists, otherwise `type: "custom"` factory mode backed by the scripted agent.
- `src/lib/demo-agent.ts` — the scripted agent. Reads the user's message and the board context, then streams real AG-UI events (`TOOL_CALL_START/ARGS/END`, `TEXT_MESSAGE_*`). Keyword heuristics replace the model; the runtime, frontend tools, and generative UI are the same code path live mode uses.
- `src/components/mood-board.tsx` — the page. `useFrontendTool` for `addMoodCard` / `updateMoodCard` / `clearBoard` (each with a `render` so the tool call shows as a card preview in chat), `useAgentContext` to expose the current board (ids included, so updates can target a card), `useConfigureSuggestions` for the starter pills, and `CopilotSidebar`.
- `src/lib/cards.ts` — card model + zod schemas shared by the tools and the agent.
- `src/lib/card-store.ts` — tiny `useSyncExternalStore` store backed by `sessionStorage` (survives refresh, not tab close).
- `bunfig.toml` — `[install] minimumReleaseAge = 259200` set before the first install.

Scaffolded with `bunx create-next-app@latest copilotkit-moodboard --ts --tailwind --eslint --app --src-dir --use-bun --skip-install --disable-git --yes`.
