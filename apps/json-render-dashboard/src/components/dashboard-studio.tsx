"use client";

import { JSONUIProvider, Renderer, useUIStream } from "@json-render/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { catalog, componentDescriptions, componentNames } from "@/lib/catalog";
import { registry } from "@/lib/registry";

const EXAMPLES = [
  "Show me a Q3 revenue dashboard for the online store",
  "Product growth: users, signups, churn",
  "Platform health for the API cluster",
  "Sales by region with a pie chart",
];

type Props = { modeLabel: string; isMock: boolean };

export function DashboardStudio({ modeLabel, isMock }: Props) {
  const [prompt, setPrompt] = useState(EXAMPLES[0]);
  const [showPrompt, setShowPrompt] = useState(false);
  const { spec, isStreaming, error, rawLines, send, clear } = useUIStream({ api: "/api/generate" });
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [rawLines.length]);

  const usedTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const el of Object.values(spec?.elements ?? {})) counts.set(el.type, (counts.get(el.type) ?? 0) + 1);
    return counts;
  }, [spec]);

  const systemPrompt = useMemo(() => catalog.prompt(), []);
  const hasSpec = !!spec?.root && !!spec.elements[spec.root];

  const submit = (text: string) => {
    if (!text.trim() || isStreaming) return;
    setPrompt(text);
    void send(text);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
            json-render <span className="text-zinc-500">/</span> mini dashboard
          </h1>
          <p className="text-sm text-zinc-400">Prompt → catalog-constrained JSON patches → React, rendered as they stream.</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            isMock ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }`}
          data-testid="mode-badge"
        >
          {modeLabel}
        </span>
      </header>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(prompt);
        }}
      >
        <div className="flex gap-2">
          <input
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the dashboard you want…"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={isStreaming || !prompt.trim()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStreaming ? "Generating…" : "Generate"}
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={isStreaming || !spec}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => submit(ex)}
              disabled={isStreaming}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-violet-500/60 hover:text-zinc-100 disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error.message}</p>
      )}

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-h-[24rem] rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5" data-testid="canvas">
          {hasSpec ? (
            <JSONUIProvider registry={registry}>
              <Renderer spec={spec} registry={registry} loading={isStreaming} />
            </JSONUIProvider>
          ) : (
            <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2 text-center text-sm text-zinc-500">
              <p className="text-zinc-300">{isStreaming ? "Waiting for the first patch…" : "Nothing rendered yet."}</p>
              <p>Type a prompt or pick an example. Elements appear one patch at a time.</p>
            </div>
          )}
        </main>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Catalog · guardrails</h2>
            <ul className="mt-3 flex flex-col gap-1.5">
              {componentNames.map((name) => {
                const count = usedTypes.get(name) ?? 0;
                return (
                  <li key={name} className="flex items-start justify-between gap-2 text-xs" title={componentDescriptions[name]}>
                    <span className={count ? "font-medium text-violet-300" : "text-zinc-400"}>{name}</span>
                    <span className={`font-mono ${count ? "text-violet-300" : "text-zinc-600"}`}>{count ? `×${count}` : "—"}</span>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setShowPrompt((v) => !v)}
              className="mt-3 text-xs text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
            >
              {showPrompt ? "Hide" : "Show"} generated system prompt
            </button>
            {showPrompt && (
              <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-zinc-900 p-2 text-[10px] leading-snug text-zinc-400">{systemPrompt}</pre>
            )}
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">SpecStream · JSONL</h2>
              <span className="font-mono text-xs text-zinc-500" data-testid="patch-count">
                {rawLines.length} patch{rawLines.length === 1 ? "" : "es"}
                {isStreaming && <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 align-middle" />}
              </span>
            </div>
            <ol ref={logRef} className="mt-3 max-h-80 flex-1 overflow-auto font-mono text-[10px] leading-snug text-zinc-400">
              {rawLines.length === 0 && <li className="text-zinc-600">Patches will appear here as they stream in.</li>}
              {rawLines.map((line, i) => (
                <li key={i} className="animate-rise truncate border-b border-zinc-900 py-1" title={line}>
                  {line}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
