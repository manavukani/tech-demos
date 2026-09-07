import type { MoodCardInput } from "@/lib/cards";

type Props = {
  card: Partial<MoodCardInput>;
  compact?: boolean;
  tilt?: number;
  onRemove?: () => void;
};

const FALLBACK_ACCENT = "#a3a3a3";

export function MoodCardView({ card, compact = false, tilt = 0, onRemove }: Props) {
  const accent = card.accent && /^#[0-9a-f]{6}$/i.test(card.accent) ? card.accent : FALLBACK_ACCENT;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 text-zinc-100 shadow-lg shadow-black/30 backdrop-blur transition-transform duration-300 ${
        compact ? "w-60 p-3" : "p-5 hover:-translate-y-1 hover:rotate-0"
      }`}
      style={{
        transform: compact ? undefined : `rotate(${tilt}deg)`,
        boxShadow: `0 12px 40px -18px ${accent}aa, 0 1px 0 0 ${accent}33 inset`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <span className={compact ? "text-2xl leading-none" : "text-4xl leading-none"} aria-hidden>
          {card.emoji ?? "✨"}
        </span>
        <span
          className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20"
          style={{ background: accent }}
          title={accent}
        />
      </div>
      <h3 className={`mt-3 font-semibold tracking-tight ${compact ? "text-sm" : "text-lg"}`}>
        {card.title ?? <span className="text-zinc-500">Untitled vibe…</span>}
      </h3>
      <p className={`mt-1 text-zinc-300/90 ${compact ? "text-xs leading-snug" : "text-sm leading-relaxed"}`}>
        {card.blurb ?? <span className="text-zinc-500">…</span>}
      </p>
      <div className="mt-4 h-1 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${card.title ?? "card"}`}
          className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-black/50 text-zinc-300 hover:bg-black/80 hover:text-white group-hover:flex"
        >
          ×
        </button>
      )}
    </article>
  );
}
