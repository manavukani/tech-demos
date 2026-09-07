import {
  BuiltInAgent,
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { demoAgent } from "@/lib/demo-agent";
import { getLlmMode } from "@/lib/llm-mode";

const CURATOR_PROMPT = `You are the copilot for a personal mood board.
The user describes feelings, scenes, or aesthetics; you turn them into mood cards using the tools provided.

Rules:
- To add a card call addMoodCard. Title: 2-5 words. Blurb: one evocative sentence, at most 20 words. Emoji: exactly one. Accent: a 6-digit hex color that matches the vibe.
- If the user asks for several vibes, call addMoodCard once per card in the same turn.
- To change an existing card use updateMoodCard with the card id from the board context. Only pass the fields that change.
- Use clearBoard only when explicitly asked to clear or reset everything.
- After tools run, reply in one short friendly sentence. No bullet lists, no markdown headers.`;

const mode = getLlmMode();

const agent =
  mode.kind === "live"
    ? new BuiltInAgent({ model: mode.model, prompt: CURATOR_PROMPT })
    : new BuiltInAgent({ type: "custom", factory: demoAgent });

const runtime = new CopilotRuntime({
  agents: { default: agent },
  runner: new InMemoryAgentRunner(),
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
