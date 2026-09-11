import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { catalog } from "@/lib/catalog";
import { getGeneratorMode } from "@/lib/generator-mode";
import { mockSpecStream } from "@/lib/mock-generator";

export const runtime = "nodejs";

const CUSTOM_RULES = [
  "The root element must be a Dashboard. Put every other element in its children array.",
  "Start with a Heading (level 3) followed by exactly three MetricCard elements, then one BarChart and one List.",
  "Use realistic, plausible numbers. Format currency and percentages as display strings in MetricCard.value.",
  "If the user asks for a component that is not in the catalog, add a Text element with tone=warning explaining what you used instead.",
];

export async function POST(req: Request) {
  const { prompt } = (await req.json()) as { prompt?: string };
  if (!prompt?.trim()) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  const mode = getGeneratorMode();

  if (mode.kind === "mock") {
    return new Response(mockSpecStream(prompt), {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const model =
    mode.provider === "openai"
      ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(mode.model)
      : mode.model; // "provider/model" string → Vercel AI Gateway (AI_GATEWAY_API_KEY)

  const result = streamText({
    model,
    system: catalog.prompt({ customRules: CUSTOM_RULES }),
    prompt,
  });

  return result.toTextStreamResponse();
}
