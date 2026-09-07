import type { BuiltInAgentModel } from "@copilotkit/runtime/v2";

export type LlmMode =
  | { kind: "live"; model: BuiltInAgentModel }
  | { kind: "demo" };

/**
 * Picks the LLM provider from whichever key is present. With no key at all we
 * fall back to a scripted "demo" agent so the UI is still fully demoable.
 */
export function getLlmMode(env: NodeJS.ProcessEnv = process.env): LlmMode {
  const override = env.MOODBOARD_MODEL?.trim();
  if (override) return { kind: "live", model: override };
  if (env.OPENAI_API_KEY) return { kind: "live", model: "openai/gpt-4o-mini" };
  if (env.ANTHROPIC_API_KEY)
    return { kind: "live", model: "anthropic/claude-haiku-4-5" };
  if (env.GOOGLE_API_KEY) return { kind: "live", model: "google/gemini-2.5-flash" };
  return { kind: "demo" };
}
