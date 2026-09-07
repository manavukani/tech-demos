const PORT = Number(Bun.env.PORT ?? 3000);
const STARTED_AT = new Date();

function page(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>tech-demos · hello</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        background: radial-gradient(1200px 800px at 20% -10%, #1e293b, #020617 60%);
        color: #e2e8f0;
      }
      .card {
        width: min(560px, 92vw);
        padding: 40px;
        border-radius: 20px;
        background: rgba(15, 23, 42, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 30px 80px rgba(2, 6, 23, 0.6);
        backdrop-filter: blur(6px);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(56, 189, 248, 0.14);
        color: #7dd3fc;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 12px #22c55e; }
      h1 { margin: 18px 0 8px; font-size: 34px; line-height: 1.1; }
      p { margin: 0; color: #94a3b8; line-height: 1.6; }
      code { color: #f8fafc; background: rgba(148,163,184,0.12); padding: 2px 6px; border-radius: 6px; }
      .grid { margin-top: 28px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .tile { padding: 16px; border-radius: 12px; background: rgba(2,6,23,0.5); border: 1px solid rgba(148,163,184,0.12); }
      .tile span { display: block; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
      .tile strong { font-size: 18px; }
      a.button {
        margin-top: 28px; display: inline-block; text-decoration: none;
        padding: 12px 18px; border-radius: 10px; font-weight: 600;
        background: linear-gradient(135deg, #38bdf8, #6366f1); color: #0b1120;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <span class="badge"><span class="dot"></span> Cloud Agent environment · online</span>
      <h1>Hello from tech-demos</h1>
      <p>This starter app confirms the <strong>Bun</strong> monorepo toolchain works end to end. Add a new demo under <code>apps/&lt;slug&gt;/</code> and run it with <code>bun run dev</code>.</p>
      <div class="grid">
        <div class="tile"><span>Runtime</span><strong>Bun ${Bun.version}</strong></div>
        <div class="tile"><span>Served by</span><strong>Bun.serve</strong></div>
        <div class="tile"><span>Health</span><strong><a style="color:#7dd3fc" href="/api/health">/api/health</a></strong></div>
        <div class="tile"><span>Started</span><strong>${STARTED_AT.toISOString().replace("T", " ").slice(0, 19)}Z</strong></div>
      </div>
      <a class="button" href="/api/health">Check health endpoint →</a>
    </main>
  </body>
</html>`;
}

const server = Bun.serve({
  port: PORT,
  routes: {
    "/": () => new Response(page(), { headers: { "content-type": "text/html; charset=utf-8" } }),
    "/api/health": () =>
      Response.json({
        ok: true,
        app: "@tech-demos/hello",
        runtime: `bun@${Bun.version}`,
        uptimeSeconds: Math.round((Date.now() - STARTED_AT.getTime()) / 1000),
        startedAt: STARTED_AT.toISOString(),
      }),
  },
  fetch: () => new Response("Not found", { status: 404 }),
});

console.log(`hello demo listening on http://localhost:${server.port}`);
