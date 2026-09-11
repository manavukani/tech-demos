export type GeneratorMode =
  | { kind: "mock" }
  | { kind: "live"; provider: "openai" | "gateway"; model: string };

/**
 * Server-only. Picks the generator from env:
 *  - OPENAI_API_KEY      → OpenAI directly (model id from JSON_RENDER_MODEL, default gpt-4o-mini)
 *  - AI_GATEWAY_API_KEY  → Vercel AI Gateway ("provider/model" string, default anthropic/claude-haiku-4.5)
 *  - neither             → scripted mock generator
 */
export function getGeneratorMode(): GeneratorMode {
  if (process.env.OPENAI_API_KEY) {
    return { kind: "live", provider: "openai", model: process.env.JSON_RENDER_MODEL || "gpt-4o-mini" };
  }
  if (process.env.AI_GATEWAY_API_KEY) {
    return { kind: "live", provider: "gateway", model: process.env.JSON_RENDER_MODEL || "anthropic/claude-haiku-4.5" };
  }
  return { kind: "mock" };
}
