import type { Extracted, Household, RawMessage, SignalKind } from "../core/types.ts";
import { generateJson, geminiReady, type Schema } from "./gemini.ts";

/**
 * Model-backed refinement of the rules parser. The rules output is always the
 * floor; this fills what the rules miss (scanned PDFs, long newsletters, voice
 * notes, odd phrasing) and can correct the kind and the children.
 */

export interface LlmExtraction {
  kind: SignalKind;
  title?: string;
  childNames?: string[];
  when?: { start: string; end?: string; allDay?: boolean };
  previousWhen?: { start: string; end?: string };
  deadline?: string;
  location?: string;
  amount?: number;
  items?: string[];
  requires?: Extracted["requires"];
  summary?: string;
  hostile?: boolean;
  facts?: string[];
}

export function llmConfigured(): "gemini" | null {
  return geminiReady() ? "gemini" : null;
}

const SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    kind: { type: "STRING", enum: ["permission_request", "schedule_change", "invitation", "appointment", "purchase_need", "registration", "coparent_message", "event", "fyi"] },
    title: { type: "STRING", description: "Short, parent-facing, starts with the child's name if known" },
    childNames: { type: "ARRAY", items: { type: "STRING" } },
    when: { type: "OBJECT", nullable: true, properties: { start: { type: "STRING", description: "Local ISO YYYY-MM-DDTHH:mm" }, end: { type: "STRING", nullable: true }, allDay: { type: "BOOLEAN", nullable: true } }, required: ["start"] },
    previousWhen: { type: "OBJECT", nullable: true, properties: { start: { type: "STRING" }, end: { type: "STRING", nullable: true } }, required: ["start"] },
    deadline: { type: "STRING", nullable: true, description: "Local ISO date YYYY-MM-DD by which the parent must act" },
    location: { type: "STRING", nullable: true },
    amount: { type: "NUMBER", nullable: true },
    items: { type: "ARRAY", items: { type: "STRING" }, description: "Things to bring or buy" },
    requires: { type: "ARRAY", items: { type: "STRING", enum: ["signature", "payment", "rsvp", "reply", "purchase", "transport", "item", "decision"] } },
    summary: { type: "STRING", description: "One calm sentence for a parent" },
    hostile: { type: "BOOLEAN", nullable: true },
    facts: { type: "ARRAY", items: { type: "STRING" }, description: "For co-parent messages: the logistics facts only, neutrally phrased" },
  },
  required: ["kind", "childNames", "items", "requires", "summary"],
};

export async function llmExtract(raw: RawMessage, h: Household, now: string): Promise<LlmExtraction | null> {
  if (!geminiReady()) return null;
  const kids = h.people.filter((p) => p.role === "child").map((c) => `${c.name} (${c.age ?? "?"}, ${c.yearLevel ?? ""}${c.school ? `, ${c.school}` : ""})`).join("; ");
  const coparent = h.people.find((p) => p.role === "coparent");
  const system = `You are the intake agent of a family logistics assistant in ${h.timezone}. Today is ${now}. Extract structured logistics; never invent dates. Resolve relative dates ("this Saturday") against today. Children: ${kids || "unknown"}. Known places: ${h.places.map((p) => p.name).join("; ")}. Co-parent: ${coparent?.name ?? "none"}. "Year 6", "U8s", age ranges and school names identify children.`;
  const prompt = `Channel: ${raw.channel}\nFrom: ${raw.from}\nSubject: ${raw.subject ?? ""}\n\n${raw.body}`;
  try {
    return await generateJson<LlmExtraction>(prompt, SCHEMA, { system });
  } catch (err) {
    console.warn(`[gemini] extraction failed, rules parser only: ${(err as Error).message}`);
    return null;
  }
}
