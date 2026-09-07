import { EventType, type BaseEvent, type Message, type RunAgentInput } from "@ag-ui/client";
import {
  ADD_CARD_TOOL,
  CLEAR_BOARD_TOOL,
  UPDATE_CARD_TOOL,
  type MoodCard,
  type MoodCardInput,
  type UpdateMoodCardInput,
} from "./cards";

/**
 * A scripted stand-in for the LLM, used when no provider key is configured.
 *
 * It speaks the same AG-UI protocol a real model would: it reads the user's
 * message, decides which frontend tool to call, streams the tool call, and on
 * the follow-up run (after the browser has executed the tool) streams a short
 * confirmation. Keyword heuristics replace the model's judgment; everything
 * downstream (CopilotKit runtime, frontend tools, generative UI) is real.
 */

type Vibe = MoodCardInput & { keys: string[] };

const toCard = ({ title, blurb, emoji, accent }: Vibe): MoodCardInput => ({ title, blurb, emoji, accent });

const VIBES: Vibe[] = [
  { keys: ["cozy", "cosy", "blanket", "fireplace", "hygge"], title: "Cozy Cabin Evening", blurb: "Wool socks, a crackling fire, and nowhere to be until morning.", emoji: "🔥", accent: "#c2410c" },
  { keys: ["rain", "rainy", "storm", "drizzle", "monsoon"], title: "Rainy Day Reading Nook", blurb: "Grey skies outside, warm tea inside, and a paperback going soft at the corners.", emoji: "🌧️", accent: "#475569" },
  { keys: ["beach", "summer", "sun", "sunny", "surf", "tropical", "island"], title: "Endless Summer", blurb: "Salt in your hair, sand in the car, and the sun refusing to set.", emoji: "🏖️", accent: "#f59e0b" },
  { keys: ["neon", "cyber", "cyberpunk", "synth", "synthwave", "arcade", "tokyo"], title: "Neon Rain Downtown", blurb: "Wet asphalt reflecting pink signage; the city hums at 2 a.m.", emoji: "🌆", accent: "#d946ef" },
  { keys: ["forest", "woods", "trees", "hike", "hiking", "moss", "cabin"], title: "Deep Forest Quiet", blurb: "Moss underfoot, filtered light, and the kind of silence you can hear.", emoji: "🌲", accent: "#15803d" },
  { keys: ["retro", "vintage", "70s", "80s", "90s", "polaroid", "vinyl", "record"], title: "Sunday Vinyl Spin", blurb: "Warm crackle, orange shag carpet, and an album played start to finish.", emoji: "📻", accent: "#b45309" },
  { keys: ["minimal", "minimalist", "clean", "calm", "zen", "quiet", "simple"], title: "Still Water Minimal", blurb: "One chair, one window, one thought at a time.", emoji: "🪨", accent: "#64748b" },
  { keys: ["space", "cosmic", "galaxy", "stars", "astronaut", "moon", "nebula"], title: "Drifting Past Saturn", blurb: "Weightless, wordless, and lit only by a ring of ice and dust.", emoji: "🪐", accent: "#4f46e5" },
  { keys: ["autumn", "fall", "leaves", "pumpkin", "october", "harvest"], title: "Amber October", blurb: "Crunching leaves, cinnamon air, and light that turns everything gold.", emoji: "🍂", accent: "#ea580c" },
  { keys: ["coffee", "cafe", "café", "espresso", "latte", "morning"], title: "First Pour Ritual", blurb: "Steam curling off the cup while the city is still deciding to wake up.", emoji: "☕", accent: "#78350f" },
  { keys: ["ocean", "sea", "waves", "deep", "underwater", "coral", "dive"], title: "Blue Beyond Blue", blurb: "Cold clear water, slow shafts of light, and a horizon with no edges.", emoji: "🌊", accent: "#0284c7" },
  { keys: ["sunset", "golden", "dusk", "twilight", "evening"], title: "Golden Hour Rooftop", blurb: "Everything is peach and lavender for exactly eleven minutes.", emoji: "🌇", accent: "#f97316" },
  { keys: ["winter", "snow", "frost", "ice", "cold", "alpine", "ski"], title: "Fresh Snow Hush", blurb: "The world muffled under white, breath hanging in the air like a thought.", emoji: "❄️", accent: "#38bdf8" },
  { keys: ["party", "disco", "dance", "club", "celebrate", "birthday", "festival"], title: "Disco Til Sunrise", blurb: "Mirror-ball confetti, bass in your ribs, and nobody checking the time.", emoji: "🪩", accent: "#e11d48" },
  { keys: ["study", "focus", "deep work", "library", "exam", "productive", "lofi", "lo-fi"], title: "Lo-fi Focus Session", blurb: "Soft beats, a desk lamp halo, and the satisfying scratch of a to-do list.", emoji: "📚", accent: "#0f766e" },
  { keys: ["garden", "spring", "flowers", "bloom", "picnic", "meadow"], title: "Wildflower Picnic", blurb: "A checkered blanket, buzzing bees, and lemonade going warm in the sun.", emoji: "🌼", accent: "#ca8a04" },
  { keys: ["desert", "canyon", "dune", "cactus", "southwest"], title: "Red Rock Desert", blurb: "Heat shimmer, terracotta cliffs, and a sky too big to photograph.", emoji: "🌵", accent: "#dc2626" },
  { keys: ["night", "midnight", "insomnia", "late", "nocturnal", "dark"], title: "3 a.m. Thoughts", blurb: "Blue screen glow, a humming fridge, and ideas that only visit after midnight.", emoji: "🌙", accent: "#1e3a8a" },
  { keys: ["road", "roadtrip", "road trip", "drive", "highway", "route 66"], title: "Open Road Mixtape", blurb: "Windows down, map folded wrong, and a playlist that knows the way.", emoji: "🚗", accent: "#0d9488" },
  { keys: ["mystery", "noir", "detective", "spooky", "gothic", "haunted"], title: "Velvet Noir", blurb: "Rain on a fedora, a single desk lamp, and a case that doesn't add up.", emoji: "🕵️", accent: "#312e81" },
];

const COLOR_WORDS: Record<string, string> = {
  red: "#dc2626", orange: "#ea580c", amber: "#d97706", yellow: "#ca8a04", lime: "#65a30d",
  green: "#16a34a", emerald: "#059669", teal: "#0d9488", cyan: "#0891b2", sky: "#0284c7",
  blue: "#2563eb", indigo: "#4f46e5", violet: "#7c3aed", purple: "#9333ea", fuchsia: "#c026d3",
  pink: "#db2777", rose: "#e11d48", brown: "#78350f", gray: "#4b5563", grey: "#4b5563",
  black: "#171717", white: "#e5e5e5", gold: "#f59e0b", navy: "#1e3a8a", coral: "#f97362",
  lavender: "#a78bfa", mint: "#6ee7b7", peach: "#fdba74", turquoise: "#2dd4bf",
};

const COUNT_WORDS: Record<string, number> = {
  one: 1, a: 1, an: 1, single: 1, two: 2, couple: 2, pair: 2, three: 3, few: 3, four: 4, five: 5,
};

const FILLER =
  /\b(please|can|could|would|you|give|me|add|create|make|pin|put|generate|drop|show|i|want|need|a|an|the|some|another|new|card|cards|vibe|vibes|mood|moods|board|for|about|of|with|to|on|my|that|feels?|like|something|inspired|by)\b/gi;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function textOf(message: Message | undefined): string {
  if (!message || !("content" in message) || message.content == null) return "";
  if (typeof message.content === "string") return message.content;
  return (message.content as Array<{ type: string; text?: string }>)
    .map((part) => (part.type === "text" ? part.text ?? "" : ""))
    .join(" ");
}

function boardFromContext(input: RunAgentInput): MoodCard[] {
  for (const ctx of input.context ?? []) {
    if (!/mood board/i.test(ctx.description)) continue;
    try {
      const parsed = JSON.parse(ctx.value) as { cards?: MoodCard[] };
      if (Array.isArray(parsed.cards)) return parsed.cards;
    } catch {
      /* not JSON — ignore */
    }
  }
  return [];
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function pickVibes(text: string): MoodCardInput[] {
  const lower = text.toLowerCase();
  const matched = VIBES.filter((v) => v.keys.some((k) => lower.includes(k)));

  const countMatch = lower.match(/\b(\d+|one|a|an|single|two|couple|pair|three|few|four|five)\b\s+(?:more\s+|new\s+|different\s+)?(?:vibes?|cards?|moods?|ideas?|options?)/);
  const requested = countMatch
    ? Math.min(5, Number(countMatch[1]) || COUNT_WORDS[countMatch[1]] || 1)
    : Math.max(1, matched.length);

  const picks: MoodCardInput[] = matched.slice(0, requested).map(toCard);

  if (picks.length === 0) {
    // No known keyword: build a card from the user's own words.
    const phrase = lower.replace(FILLER, " ").replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim();
    const seed = hash(lower);
    const fallback = VIBES[seed % VIBES.length];
    picks.push({
      title: phrase ? titleCase(phrase).slice(0, 40) : "Unnamed Vibe",
      blurb: phrase
        ? `Everything that "${phrase}" makes you feel, pinned down before it drifts away.`
        : "A feeling too vague to name and too good to lose.",
      emoji: fallback.emoji,
      accent: fallback.accent,
    });
  }

  // Requested more than matched: fill deterministically from the rest of the deck.
  let i = hash(lower);
  while (picks.length < requested) {
    const candidate = VIBES[i++ % VIBES.length];
    if (!picks.some((p) => p.title === candidate.title)) picks.push(toCard(candidate));
  }
  return picks;
}

function findTargetCard(text: string, board: MoodCard[]): MoodCard | undefined {
  if (board.length === 0) return undefined;
  const lower = text.toLowerCase();
  const scored = board
    .map((card) => {
      const words = card.title.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
      const score = words.filter((w) => lower.includes(w)).length;
      return { card, score };
    })
    .sort((a, b) => b.score - a.score);
  if (scored[0].score > 0) return scored[0].card;
  if (/\b(first|top|oldest)\b/.test(lower)) return board[0];
  return board[board.length - 1];
}

function planUpdate(text: string, card: MoodCard): UpdateMoodCardInput {
  const lower = text.toLowerCase();
  const patch: UpdateMoodCardInput = { id: card.id };

  for (const [word, hex] of Object.entries(COLOR_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      patch.accent = hex;
      break;
    }
  }
  const hex = text.match(/#[0-9a-f]{6}\b/i);
  if (hex) patch.accent = hex[0].toLowerCase();

  const rename = text.match(/(?:rename|retitle|call|title)\s+(?:it|that|this|the card|.*?card)?\s*(?:to|as)?\s*["“']?([^"”']{2,40})["”']?\s*$/i);
  if (rename && !/^\s*(red|blue|green|pink|purple|orange|yellow)\s*$/i.test(rename[1])) {
    patch.title = titleCase(rename[1].trim());
  }

  const vibe = VIBES.find((v) => v.keys.some((k) => lower.includes(k)));
  if (/\b(emoji|icon)\b/.test(lower) && vibe) patch.emoji = vibe.emoji;
  if (/\b(blurb|description|text|caption|rewrite)\b/.test(lower)) {
    patch.blurb = vibe
      ? vibe.blurb
      : `${card.title}, but louder: the same feeling with the volume turned up.`;
  }
  if (/\b(moodier|darker)\b/.test(lower)) patch.accent = "#1e293b";
  if (/\b(brighter|lighter|happier)\b/.test(lower)) patch.accent = "#fbbf24";

  if (Object.keys(patch).length === 1 && vibe) {
    patch.emoji = vibe.emoji;
    patch.accent = vibe.accent;
  }
  return patch;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function* streamText(text: string): AsyncGenerator<BaseEvent> {
  const messageId = crypto.randomUUID();
  yield { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" } as BaseEvent;
  for (const word of text.split(/(?<=\s)/)) {
    yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: word } as BaseEvent;
    await sleep(18);
  }
  yield { type: EventType.TEXT_MESSAGE_END, messageId } as BaseEvent;
}

async function* streamToolCall(name: string, args: unknown): AsyncGenerator<BaseEvent> {
  const toolCallId = crypto.randomUUID();
  const json = JSON.stringify(args);
  yield { type: EventType.TOOL_CALL_START, toolCallId, toolCallName: name } as BaseEvent;
  // Stream args in a few slices so the in-chat generative UI shows the partial state.
  const slice = Math.max(12, Math.ceil(json.length / 4));
  for (let i = 0; i < json.length; i += slice) {
    yield { type: EventType.TOOL_CALL_ARGS, toolCallId, delta: json.slice(i, i + slice) } as BaseEvent;
    await sleep(90);
  }
  yield { type: EventType.TOOL_CALL_END, toolCallId } as BaseEvent;
}

type ToolOutcome = { action?: string; card?: Partial<MoodCard>; count?: number };

function summarizeToolResults(results: ToolOutcome[]): string {
  const added = results.filter((r) => r.action === "added" && r.card);
  const updated = results.filter((r) => r.action === "updated" && r.card);
  const cleared = results.find((r) => r.action === "cleared");
  const parts: string[] = [];
  if (cleared) parts.push("Board wiped clean, fresh start.");
  if (added.length === 1) {
    const c = added[0].card!;
    parts.push(`Pinned ${c.emoji ?? ""} **${c.title}** to your board.`);
  } else if (added.length > 1) {
    parts.push(`Pinned ${added.length} new cards: ${added.map((r) => `**${r.card!.title}**`).join(", ")}.`);
  }
  if (updated.length) {
    parts.push(`Updated **${updated.map((r) => r.card!.title).join("**, **")}**.`);
  }
  if (parts.length === 0) return "Done. Anything else for the board?";
  parts.push(pickFollowUp(results.map((r) => r.card?.title ?? "").join("|")));
  return parts.join(" ");
}

function pickFollowUp(seed: string): string {
  const options = [
    "Want a contrasting vibe next to it?",
    "Say the word and I'll recolor or rename it.",
    "Try asking for three more in one go.",
    "Tell me a color and I'll retint the last card.",
  ];
  return options[hash(seed) % options.length];
}

const HELP_TEXT =
  "I'm your mood board copilot (demo mode: no LLM key set, so I'm running on a scripted brain). " +
  "Describe a feeling and I'll pin a card for it: try _\"a cozy rainy-day vibe\"_, _\"three summer cards\"_, " +
  "_\"make the last one purple\"_, or _\"clear the board\"_.";

export async function* demoAgent({ input }: { input: RunAgentInput }): AsyncGenerator<BaseEvent> {
  const messages = input.messages;
  const last = messages[messages.length - 1];
  if (!last) return;

  // Follow-up run: the browser executed our tool call(s) and sent back results.
  if (last.role === "tool") {
    const results: ToolOutcome[] = [];
    for (let i = messages.length - 1; i >= 0 && messages[i].role === "tool"; i--) {
      try {
        results.unshift(JSON.parse(textOf(messages[i])) as ToolOutcome);
      } catch {
        results.unshift({});
      }
    }
    yield* streamText(summarizeToolResults(results));
    return;
  }

  if (last.role !== "user") return;

  const text = textOf(last).trim();
  const lower = text.toLowerCase();
  const board = boardFromContext(input);

  if (/^(hi|hello|hey|yo|help|what can you do|who are you)\b/.test(lower) || lower.length < 3) {
    yield* streamText(HELP_TEXT);
    return;
  }

  if (/\b(clear|reset|wipe|empty|delete all|remove all|start over)\b/.test(lower)) {
    if (board.length === 0) {
      yield* streamText("The board is already empty. Describe a vibe and I'll start pinning.");
      return;
    }
    yield* streamToolCall(CLEAR_BOARD_TOOL, {});
    return;
  }

  const wantsUpdate =
    board.length > 0 &&
    /\b(change|update|rename|retitle|recolor|recolour|tint|turn|swap|edit|tweak|rewrite|make (?:it|that|the|this)|darker|moodier|brighter)\b/.test(lower) &&
    !/\b(new card|another card|add a|add another)\b/.test(lower);

  if (wantsUpdate) {
    const target = findTargetCard(text, board);
    if (target) {
      yield* streamToolCall(UPDATE_CARD_TOOL, planUpdate(text, target));
      return;
    }
  }

  for (const card of pickVibes(text)) {
    yield* streamToolCall(ADD_CARD_TOOL, card);
  }
}
