import fs from "node:fs";
import path from "node:path";

/**
 * Gemini client with no SDK: plain fetch against the Generative Language API.
 * Every call asks for JSON against a schema, so downstream code never parses prose.
 * The key comes from GOOGLE_API_KEY / GEMINI_API_KEY or from data/config.json (set during onboarding).
 */

export interface GeminiConfig {
  apiKey?: string;
  model: string;
  ttsModel: string;
  ttsVoice: string;
}

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

export function readConfigFile(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function writeConfigFile(patch: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...readConfigFile(), ...patch }, null, 2));
}

export function geminiConfig(): GeminiConfig {
  const file = readConfigFile();
  return {
    apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || (typeof file.geminiKey === "string" ? file.geminiKey : undefined),
    model: process.env.FAMILY_OS_MODEL || (typeof file.geminiModel === "string" ? file.geminiModel : "gemini-2.5-flash"),
    ttsModel: process.env.FAMILY_OS_TTS_MODEL || "gemini-2.5-flash-preview-tts",
    ttsVoice: process.env.FAMILY_OS_TTS_VOICE || "Kore",
  };
}

export function geminiReady(): boolean {
  return !!geminiConfig().apiKey;
}

// Injectable transport so the whole path is testable without a key.
type FetchLike = typeof fetch;
let transport: FetchLike = (...args) => fetch(...args);
export function setTransport(f: FetchLike | null): void {
  transport = f ?? ((...args) => fetch(...args));
}

export interface Schema {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN";
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: string[];
  nullable?: boolean;
  description?: string;
}

export class GeminiError extends Error {}

export async function generateJson<T>(prompt: string, schema: Schema, opts: { system?: string; temperature?: number } = {}): Promise<T> {
  const cfg = geminiConfig();
  if (!cfg.apiKey) throw new GeminiError("No Gemini key configured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: opts.temperature ?? 0.2 },
  };
  const res = await transport(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new GeminiError(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; promptFeedback?: { blockReason?: string } };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new GeminiError(`Gemini returned no text${data.promptFeedback?.blockReason ? ` (${data.promptFeedback.blockReason})` : ""}`);
  try {
    return JSON.parse(text) as T;
  } catch {
    const m = /\{[\s\S]*\}|\[[\s\S]*\]/.exec(text);
    if (!m) throw new GeminiError("Gemini returned non-JSON");
    return JSON.parse(m[0]) as T;
  }
}

export async function generateText(prompt: string, opts: { system?: string; temperature?: number } = {}): Promise<string> {
  const cfg = geminiConfig();
  if (!cfg.apiKey) throw new GeminiError("No Gemini key configured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    generationConfig: { temperature: opts.temperature ?? 0.6 },
  };
  const res = await transport(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new GeminiError(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

/** Text to speech. Returns a WAV buffer (Gemini streams raw 24 kHz 16-bit mono PCM). */
export async function speak(text: string): Promise<Buffer> {
  const cfg = geminiConfig();
  if (!cfg.apiKey) throw new GeminiError("No Gemini key configured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.ttsModel}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: cfg.ttsVoice } } } },
  };
  const res = await transport(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new GeminiError(`Gemini TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[] };
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData) throw new GeminiError("Gemini TTS returned no audio");
  const pcm = Buffer.from(part.inlineData.data, "base64");
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType)?.[1] ?? 24000);
  return wav(pcm, rate);
}

function wav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Quick connectivity check used by onboarding: returns the model's one-word answer. */
export async function ping(): Promise<{ ok: boolean; model: string; detail: string }> {
  const cfg = geminiConfig();
  try {
    const r = await generateJson<{ ok: boolean }>("Reply with {\"ok\": true}.", { type: "OBJECT", properties: { ok: { type: "BOOLEAN" } }, required: ["ok"] });
    return { ok: !!r.ok, model: cfg.model, detail: "Connected." };
  } catch (err) {
    return { ok: false, model: cfg.model, detail: (err as Error).message };
  }
}
