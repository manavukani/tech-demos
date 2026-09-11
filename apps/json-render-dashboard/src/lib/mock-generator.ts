import { catalog, validateSpec, type Element, type Spec } from "./catalog";

/**
 * Scripted stand-in for the LLM. Produces the same SpecStream JSONL an LLM
 * would (RFC 6902 patches, one per line) so the client code path is identical
 * in mock and live mode. The assembled spec is validated against the catalog
 * before a single byte is streamed.
 */

type Patch = { op: "add" | "replace"; path: string; value: unknown };
type Step = { patch: Patch; delayMs: number };
type Leaf = { type: Element["type"]; props: Record<string, unknown> };

const COMPONENT_LIST = catalog.componentNames.join(", ");

// Things people commonly ask for that are deliberately NOT in the catalog (matched as whole words).
const UNSUPPORTED = ["pie chart", "pie", "map", "table", "gauge", "calendar", "image", "photo", "video", "form", "button"];
const unsupportedAsked = (prompt: string) =>
  UNSUPPORTED.find((w) => new RegExp(`\\b${w.replace(" ", "\\s+")}s?\\b`, "i").test(prompt));

const leaf = (type: Element["type"], props: Record<string, unknown>): Element => ({ type, props, children: [] });

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function jitter(seed: number, base: number, pct = 0.15): number {
  const r = ((seed % 1000) / 1000) * 2 - 1;
  return Math.round(base * (1 + r * pct));
}

function money(n: number): string {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;
}

type Scenario = {
  title: string;
  subtitle: string;
  metrics: Leaf[];
  chart: { title: string; unit: string | null; data: { label: string; value: number }[] };
  list: { title: string; items: string[] };
  note: string | null;
};

function pickScenario(prompt: string): Scenario {
  const p = prompt.toLowerCase();
  const seed = hash(prompt);
  const subtitle = `Generated from: “${prompt.trim()}”`;

  if (/(revenue|sales|order|store|shop|ecommerce|commerce|checkout|mrr|arr)/.test(p)) {
    return {
      title: "Q3 Revenue Overview",
      subtitle,
      metrics: [
        { type: "MetricCard", props: { label: "Revenue", value: money(jitter(seed, 1_284_000)), change: "+12.4% QoQ", trend: "up" } },
        { type: "MetricCard", props: { label: "Orders", value: jitter(seed >> 3, 8412).toLocaleString(), change: "+5.1% QoQ", trend: "up" } },
        { type: "MetricCard", props: { label: "Avg. order value", value: `$${jitter(seed >> 5, 152, 0.08)}`, change: "-2.3% QoQ", trend: "down" } },
      ],
      chart: {
        title: "Revenue by region",
        unit: "K",
        data: [
          { label: "North America", value: jitter(seed >> 7, 612) },
          { label: "Europe", value: jitter(seed >> 9, 348) },
          { label: "APAC", value: jitter(seed >> 11, 221) },
          { label: "LATAM", value: jitter(seed >> 13, 103) },
        ],
      },
      list: {
        title: "Top products",
        items: ["Nimbus Desk Lamp — 1,942 units", "Kestrel Backpack — 1,507 units", "Atlas Notebook (3-pack) — 1,211 units", "Orbit Mug — 988 units"],
      },
      note: "Refunds are excluded; APAC figures are FX-adjusted to USD.",
    };
  }

  if (/(user|signup|sign-up|growth|engagement|retention|churn|product|saas|activation|funnel)/.test(p)) {
    return {
      title: "Product Growth",
      subtitle,
      metrics: [
        { type: "MetricCard", props: { label: "Monthly active users", value: jitter(seed, 48_300).toLocaleString(), change: "+8.9% MoM", trend: "up" } },
        { type: "MetricCard", props: { label: "New signups", value: jitter(seed >> 3, 6_120).toLocaleString(), change: "+3.2% MoM", trend: "up" } },
        { type: "MetricCard", props: { label: "Churn", value: `${(jitter(seed >> 5, 310, 0.1) / 100).toFixed(2)}%`, change: "-0.4 pts", trend: "down" } },
      ],
      chart: {
        title: "Weekly active users",
        unit: null,
        data: [
          { label: "Week 1", value: jitter(seed >> 7, 21_400) },
          { label: "Week 2", value: jitter(seed >> 9, 23_100) },
          { label: "Week 3", value: jitter(seed >> 11, 22_600) },
          { label: "Week 4", value: jitter(seed >> 13, 25_800) },
          { label: "Week 5", value: jitter(seed >> 15, 27_200) },
        ],
      },
      list: {
        title: "Notable changes",
        items: ["Onboarding checklist shipped — activation +6 pts", "Mobile sessions now 41% of total", "Enterprise trial → paid conversion 18%"],
      },
      note: null,
    };
  }

  if (/(ops|infra|uptime|server|latency|error|incident|health|status|api|deploy|cluster|kubernetes|k8s)/.test(p)) {
    return {
      title: "Platform Health",
      subtitle,
      metrics: [
        { type: "MetricCard", props: { label: "Uptime (30d)", value: "99.98%", change: "SLO 99.95%", trend: "flat" } },
        { type: "MetricCard", props: { label: "p95 latency", value: `${jitter(seed, 212, 0.1)} ms`, change: "-14 ms vs last week", trend: "down" } },
        { type: "MetricCard", props: { label: "Error rate", value: `${(jitter(seed >> 3, 42, 0.2) / 100).toFixed(2)}%`, change: "+0.05 pts", trend: "up" } },
      ],
      chart: {
        title: "Requests by service (last hour)",
        unit: "req/s",
        data: [
          { label: "gateway", value: jitter(seed >> 7, 1_840) },
          { label: "auth", value: jitter(seed >> 9, 1_210) },
          { label: "search", value: jitter(seed >> 11, 760) },
          { label: "billing", value: jitter(seed >> 13, 320) },
          { label: "notifications", value: jitter(seed >> 15, 190) },
        ],
      },
      list: {
        title: "Open incidents",
        items: ["INC-2291 · Elevated 5xx on search in eu-west-1 (investigating)", "INC-2288 · Delayed webhook delivery for billing (monitoring)"],
      },
      note: "Error budget for search is 62% consumed this month.",
    };
  }

  const topic = prompt.trim().replace(/^(show|build|make|create|give)\s+(me\s+)?(a\s+|an\s+)?/i, "") || "Overview";
  return {
    title: topic.charAt(0).toUpperCase() + topic.slice(1),
    subtitle: "Mock generator: no LLM key configured, so this layout is scripted.",
    metrics: [
      { type: "MetricCard", props: { label: "Total", value: jitter(seed, 12_480).toLocaleString(), change: "+4.6%", trend: "up" } },
      { type: "MetricCard", props: { label: "This week", value: jitter(seed >> 3, 1_930).toLocaleString(), change: "+1.2%", trend: "up" } },
      { type: "MetricCard", props: { label: "Open items", value: jitter(seed >> 5, 37, 0.3).toString(), change: "-3 since yesterday", trend: "down" } },
    ],
    chart: {
      title: "Activity by day",
      unit: null,
      data: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((label, i) => ({ label, value: jitter(seed >> (7 + i * 2), 320, 0.4) })),
    },
    list: { title: "Next steps", items: ["Review the three highest-variance items", "Share this view with the team", "Set a weekly reminder"] },
    note: null,
  };
}

function buildSteps(prompt: string): Step[] {
  const s = pickScenario(prompt);
  const asked = unsupportedAsked(prompt);

  const children = ["kpi-heading", "m1", "m2", "m3", "chart", "list"];
  if (asked) children.push("guardrail");
  if (s.note) children.push("note");

  const add = (key: string, value: Element | string, delayMs: number): Step => ({
    patch: { op: "add", path: key === "root" ? "/root" : `/elements/${key}`, value },
    delayMs,
  });

  const steps: Step[] = [
    add("root", "dash", 150),
    add("dash", { type: "Dashboard", props: { title: s.title, subtitle: s.subtitle }, children }, 350),
    add("kpi-heading", leaf("Heading", { text: "Key metrics", level: "3" }), 250),
    ...s.metrics.map((m, i) => add(`m${i + 1}`, leaf(m.type, m.props), 280)),
  ];

  // Stream the chart progressively: add it empty, then replace props with a growing data array.
  const chartProps = { title: s.chart.title, unit: s.chart.unit };
  steps.push(add("chart", leaf("BarChart", { ...chartProps, data: [] }), 220));
  s.chart.data.forEach((_, i) => {
    steps.push({
      patch: { op: "replace", path: "/elements/chart/props", value: { ...chartProps, data: s.chart.data.slice(0, i + 1) } },
      delayMs: 180,
    });
  });

  steps.push(add("list", leaf("List", s.list), 300));

  if (asked) {
    steps.push(
      add(
        "guardrail",
        leaf("Text", {
          tone: "warning",
          content: `You asked for a ${asked}, but the catalog only allows: ${COMPONENT_LIST}. The generator stayed inside those guardrails and used a BarChart instead.`,
        }),
        200,
      ),
    );
  }
  if (s.note) {
    steps.push(add("note", leaf("Text", { content: s.note, tone: "muted" }), 150));
  }

  return steps;
}

/** Apply the scripted patches to an empty spec so it can be validated before streaming. */
function assembleSpec(steps: Step[]): Spec {
  const spec: Spec = { root: "", elements: {} };
  for (const { patch } of steps) {
    if (patch.path === "/root") {
      spec.root = patch.value as string;
      continue;
    }
    const [key, ...rest] = patch.path.slice("/elements/".length).split("/");
    if (rest.length === 0) spec.elements[key] = patch.value as Element;
    else if (rest[0] === "props") spec.elements[key] = { ...spec.elements[key], props: patch.value as Record<string, unknown> };
  }
  return spec;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function mockSpecStream(prompt: string): ReadableStream<Uint8Array> {
  const steps = buildSteps(prompt);
  const check = validateSpec(assembleSpec(steps));
  if (!check.ok) {
    throw new Error(`Mock generator produced a spec outside the catalog: ${check.reason}`);
  }

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const { patch, delayMs } of steps) {
        await sleep(delayMs);
        controller.enqueue(encoder.encode(JSON.stringify(patch) + "\n"));
      }
      controller.close();
    },
  });
}
