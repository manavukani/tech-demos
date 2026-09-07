"use client";

import {
  CopilotSidebar,
  ToolCallStatus,
  useAgentContext,
  useConfigureSuggestions,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import {
  ADD_CARD_TOOL,
  CLEAR_BOARD_TOOL,
  UPDATE_CARD_TOOL,
  moodCardInputSchema,
  updateMoodCardInputSchema,
  type MoodCard,
  type MoodCardInput,
  type UpdateMoodCardInput,
} from "@/lib/cards";
import { readCards, useCards } from "@/lib/card-store";
import { MoodCardView } from "./mood-card";

const SUGGESTIONS = [
  { title: "Cozy rainy day", message: "Give me a cozy rainy-day vibe" },
  { title: "Neon cyberpunk", message: "Add a neon cyberpunk card" },
  { title: "Three summer vibes", message: "Pin three summer vibes" },
  { title: "Recolor last card", message: "Make the last card purple" },
];

type Props = { mode: "demo" | string };

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function tiltFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 7) - 3) * 0.6;
}

export function MoodBoard({ mode }: Props) {
  const [cards, setCards] = useCards();

  useAgentContext({
    description: "The user's current mood board (cards, oldest first). Use card ids for updates.",
    value: {
      cardCount: cards.length,
      cards: cards.map(({ id, title, blurb, emoji, accent }) => ({ id, title, blurb, emoji, accent })),
    },
  });

  useConfigureSuggestions({ suggestions: SUGGESTIONS, available: "before-first-message" });

  useFrontendTool<MoodCardInput>({
    name: ADD_CARD_TOOL,
    description:
      "Pin a new mood card to the user's board. Use for any vibe, feeling, scene, or aesthetic the user describes.",
    parameters: moodCardInputSchema,
    handler: async (input) => {
      const card: MoodCard = { ...input, id: newId(), createdAt: Date.now() };
      setCards((prev) => [...prev, card]);
      return JSON.stringify({ action: "added", card });
    },
    render: ({ args, status }) => (
      <ToolCallFrame
        label={status === ToolCallStatus.Complete ? "Pinned to board" : "Pinning to board…"}
        done={status === ToolCallStatus.Complete}
      >
        <MoodCardView card={args} compact />
      </ToolCallFrame>
    ),
  });

  useFrontendTool<UpdateMoodCardInput>({
    name: UPDATE_CARD_TOOL,
    description:
      "Update fields of an existing mood card by id. Only include fields that should change.",
    parameters: updateMoodCardInputSchema,
    handler: async ({ id, ...patch }) => {
      const existing = readCards().find((c) => c.id === id);
      if (!existing) {
        return JSON.stringify({ action: "error", message: `No card with id ${id}` });
      }
      const changes = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      const updated = { ...existing, ...changes } as MoodCard;
      setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return JSON.stringify({ action: "updated", card: updated });
    },
    render: ({ args, status }) => {
      const base = readCards().find((c) => c.id === args.id);
      const preview = { ...base, ...stripUndefined(args) };
      return (
        <ToolCallFrame
          label={status === ToolCallStatus.Complete ? "Card updated" : "Updating card…"}
          done={status === ToolCallStatus.Complete}
        >
          <MoodCardView card={preview} compact />
        </ToolCallFrame>
      );
    },
  });

  useFrontendTool({
    name: CLEAR_BOARD_TOOL,
    description: "Remove every card from the board. Only when the user explicitly asks to clear or reset.",
    parameters: z.object({}),
    handler: async () => {
      const count = readCards().length;
      setCards(() => []);
      return JSON.stringify({ action: "cleared", count });
    },
    render: ({ status }) => (
      <ToolCallFrame label={status === ToolCallStatus.Complete ? "Board cleared" : "Clearing board…"} done={status === ToolCallStatus.Complete} />
    ),
  });

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-zinc-950/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            🎨
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Mood Board</h1>
            <p className="text-xs text-zinc-400">
              CopilotKit generative UI · ask the copilot for a vibe and a card lands here
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ModeBadge mode={mode} />
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
            {cards.length} {cards.length === 1 ? "card" : "cards"}
          </span>
        </div>
      </header>

      <main className="relative flex-1 p-6 md:p-10" data-testid="canvas">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {cards.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card) => (
              <MoodCardView
                key={card.id}
                card={card}
                tilt={tiltFor(card.id)}
                onRemove={() => setCards((prev) => prev.filter((c) => c.id !== card.id))}
              />
            ))}
          </div>
        )}
      </main>

      <CopilotSidebar
        defaultOpen
        labels={{
          modalHeaderTitle: "Vibe copilot",
          welcomeMessageText:
            mode === "demo"
              ? "Demo mode: no LLM key, so a scripted agent is driving. Describe a vibe and I'll pin a card."
              : "Describe a feeling, a place, or an aesthetic and I'll pin it to your board.",
          chatInputPlaceholder: "e.g. a cozy rainy-day vibe",
        }}
      />
    </div>
  );
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function ToolCallFrame({ label, done, children }: { label: string; done: boolean; children?: React.ReactNode }) {
  return (
    <div className="my-2 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className={`inline-block h-2 w-2 rounded-full ${done ? "bg-emerald-400" : "animate-pulse bg-amber-400"}`} />
        {label}
      </div>
      {children}
    </div>
  );
}

function ModeBadge({ mode }: { mode: Props["mode"] }) {
  if (mode === "demo") {
    return (
      <span
        className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300"
        title="No OPENAI_API_KEY / ANTHROPIC_API_KEY / GOOGLE_API_KEY found. A scripted agent is answering."
      >
        Demo mode · scripted agent
      </span>
    );
  }
  return (
    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
      Live · {mode}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="relative mx-auto mt-16 max-w-md text-center">
      <div className="text-5xl" aria-hidden>
        🗒️
      </div>
      <h2 className="mt-4 text-xl font-semibold">Your board is empty</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Open the copilot on the right and ask for a vibe — <em>“a cozy rainy-day vibe”</em>,{" "}
        <em>“three summer cards”</em>, <em>“something neon and loud”</em>. Each one becomes a card here.
      </p>
    </div>
  );
}
