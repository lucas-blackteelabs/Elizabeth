import type { Brief } from "./core/types.ts";
import type { State } from "./core/state.ts";
import { generateText, geminiReady, speak } from "./llm/gemini.ts";
import { balance, earnedThisWeek, streak } from "./core/chores.ts";
import { dateOf, fmtDay } from "./core/time.ts";

/**
 * The daily brief as something you can listen to while making dinner.
 * A template writes a serviceable script; Gemini turns it into something a
 * good producer would sign off on; Gemini TTS reads it.
 */

export function templateScript(state: State, brief: Brief): string {
  const parent = state.household.people.find((p) => p.role === "parent")?.name ?? "there";
  const day = dateOf(state.clock.now());
  const lines: string[] = [];
  lines.push(`Hi ${parent}. It's ${fmtDay(state.clock.now())}, here's your evening brief.`);
  lines.push(brief.headline);
  if (brief.decide.length) {
    lines.push("First, the things that need you.");
    brief.decide.forEach((it, i) => lines.push(`${i + 1}. ${it.title.replace(":", ",")}. ${it.narrative}${it.dueLabel ? ` That's ${it.dueLabel}.` : ""}`));
  }
  if (brief.done.length) {
    lines.push("Handled for you, no action needed:");
    for (const it of brief.done) lines.push(`${it.title.replace(":", ",")}. ${it.narrative}`);
  }
  if (brief.later.length) lines.push(`Parked for later: ${brief.later.map((it) => `${it.title.replace(":", ",")}${it.dueLabel ? ` (${it.dueLabel})` : ""}`).join("; ")}.`);
  const kids = state.household.people.filter((p) => p.role === "child");
  const kidLines = kids.map((k) => {
    const wk = earnedThisWeek(state.chores, k.id, day);
    const st = streak(state.chores, k.id, day);
    return wk || st ? `${k.name} has ${balance(state.chores, k.id)} points${wk ? `, ${wk} of them this week` : ""}${st >= 2 ? `, and a ${st}-day streak` : ""}` : null;
  }).filter(Boolean);
  if (kidLines.length) lines.push(`On the chores board: ${kidLines.join(". ")}.`);
  lines.push("That's everything. Have a good night.");
  return lines.join("\n");
}

export async function briefScript(state: State, brief: Brief): Promise<{ script: string; source: "gemini" | "template" }> {
  const base = templateScript(state, brief);
  if (!geminiReady()) return { script: base, source: "template" };
  try {
    const script = await generateText(base, {
      system: "You produce a short spoken evening brief for a busy parent, read by a warm, unhurried voice. Rewrite the notes into natural speech, under 220 words, no headings, no bullet points, no markdown, no emojis. Keep every fact, time, name and amount exactly. Do not add anything that is not in the notes. Say numbers the way a person would.",
      temperature: 0.5,
    });
    return { script: script.trim() || base, source: "gemini" };
  } catch (err) {
    console.warn(`[gemini] podcast script fell back to template: ${(err as Error).message}`);
    return { script: base, source: "template" };
  }
}

export async function briefAudio(script: string): Promise<Buffer> {
  return speak(script);
}
