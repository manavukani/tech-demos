import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

/**
 * The whole vocabulary the generator is allowed to use. Anything outside this
 * list is rejected by `catalog.validate()` and skipped by the Renderer.
 */
export const catalog = defineCatalog(schema, {
  components: {
    Dashboard: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().nullable(),
      }),
      slots: ["default"],
      description:
        "Root container. Renders children in a responsive grid. Always use exactly one Dashboard as the root.",
    },
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.enum(["1", "2", "3"]).nullable(),
      }),
      description: "Section heading that spans the full grid width.",
    },
    Text: {
      props: z.object({
        content: z.string(),
        tone: z.enum(["default", "muted", "warning"]).nullable(),
      }),
      description: "Paragraph of text spanning the full width. Use tone=warning for caveats.",
    },
    MetricCard: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        change: z.string().nullable(),
        trend: z.enum(["up", "down", "flat"]).nullable(),
      }),
      description:
        "Single KPI tile: big value, small label, optional change like '+12%' with trend up/down/flat.",
    },
    BarChart: {
      props: z.object({
        title: z.string(),
        unit: z.string().nullable(),
        data: z.array(z.object({ label: z.string(), value: z.number() })),
      }),
      description:
        "Horizontal bar chart of label/value pairs. Spans two grid columns. Keep to 3-8 bars.",
    },
    List: {
      props: z.object({
        title: z.string(),
        items: z.array(z.string()),
      }),
      description: "Bulleted list of short strings, e.g. top items, alerts, next steps.",
    },
  },
  actions: {},
});

export type Catalog = typeof catalog;
export type Spec = Catalog["_specType"];
export type Element = Spec["elements"][string];
export type ComponentName = keyof Catalog["data"]["components"];

export const componentNames = catalog.componentNames as ComponentName[];

export const componentDescriptions = Object.fromEntries(
  Object.entries(catalog.data.components).map(([name, def]) => [name, def.description ?? ""]),
) as Record<ComponentName, string>;

/**
 * `catalog.validate()` enforces the element structure and the allowed component
 * types; the per-component Zod prop schemas are checked here on top of that.
 */
export function validateSpec(spec: unknown): { ok: true } | { ok: false; reason: string } {
  const structural = catalog.validate(spec);
  if (!structural.success || !structural.data) {
    return { ok: false, reason: structural.error?.message ?? "invalid spec" };
  }
  for (const [key, el] of Object.entries(structural.data.elements)) {
    // Safe: catalog.validate() already rejected unknown component types.
    const def = catalog.data.components[el.type as ComponentName];
    const parsed = def.props.safeParse(el.props);
    if (!parsed.success) {
      return { ok: false, reason: `elements/${key} (${el.type}): ${parsed.error.message}` };
    }
  }
  return { ok: true };
}
