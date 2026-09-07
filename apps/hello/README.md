# hello

Starter demo for the `tech-demos` monorepo. A minimal [`Bun.serve`](https://bun.sh/docs/api/http) web app that renders a landing page and exposes a JSON health endpoint.

## Run

```bash
bun install        # from the repo root
cd apps/hello
bun run dev        # hot-reloading dev server on http://localhost:3000
```

- `GET /` — landing page
- `GET /api/health` — `{ ok: true, ... }` JSON

Set `PORT` to change the port (defaults to `3000`).
