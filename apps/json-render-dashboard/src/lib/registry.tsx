import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";

const trendStyles = {
  up: "text-emerald-400",
  down: "text-rose-400",
  flat: "text-zinc-400",
} as const;

const trendGlyph = { up: "▲", down: "▼", flat: "▬" } as const;

export const { registry } = defineRegistry(catalog, {
  components: {
    Dashboard: ({ props, children }) => (
      <section className="flex flex-col gap-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{props.title}</h1>
          {props.subtitle && <p className="mt-1 text-sm text-zinc-400">{props.subtitle}</p>}
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      </section>
    ),

    Heading: ({ props }) => {
      const size =
        props.level === "1" ? "text-xl" : props.level === "3" ? "text-sm uppercase tracking-wide text-zinc-400" : "text-base";
      return <h2 className={`col-span-full mt-2 font-semibold text-zinc-100 ${size}`}>{props.text}</h2>;
    },

    Text: ({ props }) => {
      const tone =
        props.tone === "warning"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
          : props.tone === "muted"
            ? "text-zinc-400"
            : "text-zinc-200";
      return (
        <p className={`col-span-full rounded-lg text-sm leading-relaxed ${props.tone === "warning" ? "border px-3 py-2" : ""} ${tone}`}>
          {props.content}
        </p>
      );
    },

    MetricCard: ({ props }) => {
      const trend = props.trend ?? "flat";
      return (
        <div className="animate-rise rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{props.label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-zinc-50">{props.value}</p>
          {props.change && (
            <p className={`mt-1 text-xs font-medium ${trendStyles[trend]}`}>
              {trendGlyph[trend]} {props.change}
            </p>
          )}
        </div>
      );
    },

    BarChart: ({ props }) => {
      const max = Math.max(1, ...props.data.map((d) => d.value));
      return (
        <div className="animate-rise rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm sm:col-span-2">
          <p className="text-sm font-medium text-zinc-200">{props.title}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {props.data.map((d, i) => (
              <li key={`${d.label}-${i}`} className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-xs">
                <span className="truncate text-zinc-400">{d.label}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-[width] duration-500"
                    style={{ width: `${(d.value / max) * 100}%` }}
                  />
                </span>
                <span className="font-mono text-zinc-300">
                  {d.value.toLocaleString()}
                  {props.unit ? ` ${props.unit}` : ""}
                </span>
              </li>
            ))}
            {props.data.length === 0 && <li className="text-xs text-zinc-500">Waiting for data…</li>}
          </ul>
        </div>
      );
    },

    List: ({ props }) => (
      <div className="animate-rise rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm">
        <p className="text-sm font-medium text-zinc-200">{props.title}</p>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-zinc-300">
          {props.items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-violet-400">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
});
