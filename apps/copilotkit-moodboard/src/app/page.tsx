import { MoodBoard } from "@/components/mood-board";
import { getLlmMode } from "@/lib/llm-mode";

export default function Home() {
  const mode = getLlmMode();
  return <MoodBoard mode={mode.kind === "live" ? mode.model : "demo"} />;
}
