# tanstack-start-demo — Link dump

Single-user "link dump" demo of [TanStack Start](https://tanstack.com/start): add, list, and filter saved URLs with SSR + client interactivity. See [PLAN.md](./PLAN.md) for scope.

## Run

```bash
bun install
bun run dev      # http://localhost:3000
```

## What's in it

- `src/routes/index.tsx` — the one page. Route `loader` calls a server function so the list is server-rendered; the add form calls a `POST` server function then `router.invalidate()`; the text filter is pure client state.
- `src/lib/links.ts` — `getLinks` / `addLink` server functions (`createServerFn`) backed by a gitignored `data/links.json`. Input validation lives in `.validator()`.
- `src/components/ui/` — shadcn/ui `Button`, `Input`, `Card` only.
- `bunfig.toml` — `[install] minimumReleaseAge = 259200` (3-day release floor) set before the first install.

Scaffolded with `bunx @tanstack/cli create --add-ons shadcn --no-install`.
