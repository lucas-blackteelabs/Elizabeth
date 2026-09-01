import type { Extracted, Household, RawMessage, SignalKind } from "../core/types.ts";

/**
 * Optional LLM refinement of the rules parser. The platform runs without it;
 * with a key it gets better recall on messy inputs (scanned PDFs, long
 * newsletters, voice notes). Configure with ANTHROPIC_API_KEY or GOOGLE_API_KEY.
 * Returned fields are merged over the rules output; the rules output is the floor.
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
}

export function llmConfigured(): "anthropic" | "gemini" | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GOOGLE_API_KEY) return "gemini";
  return null;
}

function prompt(raw: RawMessage, h: Household, now: string): string {
  const kids = h.people.filter((p) => p.role === "child").map((c) => `${c.name} (${c.age}, ${c.yearLevel}, ${c.school})`).join("; ");
  const places = h.places.map((p) => p.name).join("; ");
  return `You are the intake agent for a family logistics system. Today is ${now} (${h.timezone}).
Household children: ${kids}. Known places: ${places}. Co-parent: ${h.people.find((p) => p.role === "coparent")?.name ?? "none"}.

Extract structured logistics from the message below. Return ONLY JSON with keys:
kind (one of permission_request|schedule_change|invitation|appointment|purchase_need|registration|coparent_message|fyi),
title, childNames[], when{start,end,allDay} as local ISO "YYYY-MM-DDTHH:mm", previousWhen (if a time moved), deadline (local ISO date),
location, amount (number), items[] (things to bring or buy), requires[] (signature|payment|rsvp|reply|purchase|transport|item|decision), summary.

Channel: ${raw.channel}
From: ${raw.from}
Subject: ${raw.subject ?? ""}
Body:
${raw.body}`;
}

export async function llmExtract(raw: RawMessage, h: Household, now: string): Promise<LlmExtraction | null> {
  const provider = llmConfigured();
  if (!provider) return null;
  const text = prompt(raw, h, now);
  try {
    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: process.env.FAMILY_OS_MODEL ?? "claude-sonnet-5", max_tokens: 800, messages: [{ role: "user", content: text }] }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const data = (await res.json()) as { content: { type: string; text?: string }[] };
      const out = data.content.find((c) => c.type === "text")?.text ?? "";
      return parseJson(out);
    }
    const model = process.env.FAMILY_OS_MODEL ?? "gemini-2.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = (await res.json()) as { candidates: { content: { parts: { text: string }[] } }[] };
    return parseJson(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
  } catch (err) {
    console.warn(`[llm] extraction failed, using rules parser: ${(err as Error).message}`);
    return null;
  }
}

function parseJson(s: string): LlmExtraction | null {
  const m = /\{[\s\S]*\}/.exec(s);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as LlmExtraction;
  } catch {
    return null;
  }
}
