import { MoodBoard } from "@/components/mood-board";
import { getLlmMode } from "@/lib/llm-mode";

// The mode badge depends on env at request time, not build time.
export const dynamic = "force-dynamic";

export default function Home() {
  const mode = getLlmMode();
  return <MoodBoard mode={mode.kind === "live" ? mode.model : "demo"} />;
}
