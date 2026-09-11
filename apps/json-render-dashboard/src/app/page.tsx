import { DashboardStudio } from "@/components/dashboard-studio";
import { getGeneratorMode } from "@/lib/generator-mode";

// Read env at request time so the mode badge reflects the running process.
export const dynamic = "force-dynamic";

export default function Home() {
  const mode = getGeneratorMode();
  const modeLabel = mode.kind === "mock" ? "Mock mode · scripted generator" : `Live · ${mode.model}`;
  return <DashboardStudio modeLabel={modeLabel} isMock={mode.kind === "mock"} />;
}
