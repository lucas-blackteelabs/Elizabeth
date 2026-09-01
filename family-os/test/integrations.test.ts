import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createState, type State } from "../src/core/state.ts";
import { fixedClock, resetIds } from "../src/core/time.ts";
import { seedHousehold } from "../src/demo/household.ts";
import { DEMO_NOW } from "../src/demo/inbox.ts";
import { ingest } from "../src/orchestrator.ts";
import { composeBrief } from "../src/agents/brief.ts";
import { setTransport, generateJson, speak } from "../src/llm/gemini.ts";
import { parseIcs, expandIcs, importIcsText } from "../src/connectors/ics.ts";
import { stripHtml } from "../src/connectors/google.ts";
import { rulesDraft, draftToHousehold, SAMPLE_INTRO } from "../src/onboarding.ts";
import { complete, balance, streak, claim, isDue, defaultBoard } from "../src/core/chores.ts";
import { templateScript } from "../src/podcast.ts";

let state: State;
beforeEach(() => {
  resetIds();
  state = createState(seedHousehold(), fixedClock(DEMO_NOW));
});
afterEach(() => {
  setTransport(null);
  delete process.env.GOOGLE_API_KEY;
});

function fakeGemini(reply: unknown, capture?: (body: any) => void) {
  process.env.GOOGLE_API_KEY = "test-key";
  setTransport(async (url, init) => {
    const body = JSON.parse(String(init?.body));
    capture?.(body);
    assert.match(String(url), /generativelanguage\.googleapis\.com/);
    const text = typeof reply === "string" ? reply : JSON.stringify(reply);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200, headers: { "content-type": "application/json" } });
  });
}

test("gemini client sends a schema and parses the JSON reply", async () => {
  let sent: any;
  fakeGemini({ ok: true, n: 3 }, (b) => (sent = b));
  const r = await generateJson<{ ok: boolean; n: number }>("hi", { type: "OBJECT", properties: { ok: { type: "BOOLEAN" } } });
  assert.deepEqual(r, { ok: true, n: 3 });
  assert.equal(sent.generationConfig.responseMimeType, "application/json");
  assert.ok(sent.generationConfig.responseSchema);
});

test("gemini refinement corrects a message the rules parser cannot read", async () => {
  // Deliberately messy: no keyword the rules know, a relative date, and a child nickname.
  fakeGemini({
    kind: "appointment",
    title: "Maya: hearing test at the audiologist",
    childNames: ["Maya"],
    when: { start: "2026-09-11T10:00", end: "2026-09-11T10:30" },
    location: "Balmain Paediatrics",
    items: ["Blue Book"],
    requires: ["transport", "item"],
    summary: "Hearing test for Maya on Friday 11 September at 10am.",
  });
  const r = await ingest(state, { channel: "voice", from: "voicemail", body: "hey it's the clinic, just confirming little M's hearing thing next fri ten in the morning, bring the blue book" }, { useLlm: true });
  assert.equal(r.signal.parser, "llm");
  assert.equal(r.signal.kind, "appointment");
  assert.deepEqual(r.signal.extracted.childIds, ["c_maya"]);
  assert.equal(r.signal.extracted.when?.start, "2026-09-11T10:00");
  assert.equal(r.signal.extracted.placeId, "pl_clinic");
  assert.ok(state.calendar.some((e) => e.sourceId === r.signal.id), "event placed on the calendar");
  assert.ok(r.proposal.flags.some((f) => /Nobody is free to drive/.test(f.message)), "nobody is free on a Friday morning, and it says so");
  assert.ok(state.trace.some((t) => t.agent === "gemini" && /Refined/.test(t.detail)));
});

test("gemini failure never breaks the pipeline", async () => {
  process.env.GOOGLE_API_KEY = "test-key";
  setTransport(async () => new Response("quota", { status: 429 }));
  const r = await ingest(state, { channel: "sms", from: "Balmain Paediatrics", body: "Reminder: Maya has an appointment with Dr Chen on Wed 9 Sep at 3:15pm." }, { useLlm: true });
  assert.equal(r.signal.parser, "rules");
  assert.equal(r.signal.kind, "appointment");
});

test("gemini TTS reply is wrapped as a WAV", async () => {
  process.env.GOOGLE_API_KEY = "test-key";
  const pcm = Buffer.alloc(480, 1);
  setTransport(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: pcm.toString("base64") } }] } }] }), { status: 200 }));
  const wav = await speak("hello");
  assert.equal(wav.subarray(0, 4).toString(), "RIFF");
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.length, 44 + 480);
});

const ICS = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:train-1
SUMMARY:U12 Netball training
LOCATION:Balmain Netball Courts
DTSTART;TZID=Australia/Sydney:20260902T163000
DTEND;TZID=Australia/Sydney:20260902T173000
RRULE:FREQ=WEEKLY;BYDAY=WE;UNTIL=20260930T000000
END:VEVENT
BEGIN:VEVENT
UID:carnival
SUMMARY:Ava - Swimming carnival
DTSTART;VALUE=DATE:20260918
DTEND;VALUE=DATE:20260919
DESCRIPTION:Bring togs\\, towel and sunscreen
END:VEVENT
END:VCALENDAR`;

test("ics feeds parse, expand weekly recurrence, and import idempotently", () => {
  const events = parseIcs(ICS);
  assert.equal(events.length, 2);
  const expanded = expandIcs(events, DEMO_NOW, 60);
  assert.equal(expanded.filter((e) => e.summary.includes("Netball")).length, 5);
  const r1 = importIcsText(state, ICS, { url: "https://club.example/feed.ics", label: "netball", childId: "c_ava" });
  assert.equal(r1.added, 6);
  const r2 = importIcsText(state, ICS, { url: "https://club.example/feed.ics", label: "netball", childId: "c_ava" });
  assert.equal(r2.added, 0);
  const carnival = state.calendar.find((e) => e.title.includes("carnival"))!;
  assert.deepEqual(carnival.personIds, ["c_ava"]);
  assert.equal(state.connections.ics?.[0].events, 6);
});

test("html email bodies are flattened before parsing", () => {
  const t = stripHtml("<div><p>Dear parents,</p><p>Excursion on <b>Thursday 10 September</b>.<br>Cost $38.</p><style>p{}</style></div>");
  assert.match(t, /Dear parents,\nExcursion on Thursday 10 September\.\nCost \$38\./);
});

test("onboarding rules fallback builds a usable household from plain words", () => {
  const d = rulesDraft(SAMPLE_INTRO);
  assert.deepEqual(d.children.map((c) => [c.name, c.age]), [["Ava", 11], ["Leo", 8], ["Maya", 4]]);
  assert.deepEqual(d.adults.map((a) => [a.name, a.role]), [["Priya", "parent"], ["Tom", "parent"], ["Daniel", "coparent"]]);
  assert.deepEqual(d.children[1].allergies, ["nuts"]);
  assert.equal(d.children[0].school, "Leichhardt Public School");
  assert.equal(d.homeSuburb, "Leichhardt");
  const h = draftToHousehold(d);
  assert.equal(h.people.filter((p) => p.role === "child").length, 3);
  assert.ok(h.policies.some((p) => p.kind === "allergen"));
  assert.ok(h.policies.some((p) => p.kind === "custody"));
  assert.ok(h.policies.some((p) => p.kind === "evening_cutoff"));
});

test("chores: completion earns points, streaks count, rewards cost points", () => {
  const board = defaultBoard(state.household);
  const clock = fixedClock(DEMO_NOW);
  const leo = board.chores.filter((c) => c.childId === "c_leo");
  assert.ok(leo.length >= 3);
  const ev = complete(board, clock, leo[0].id)!;
  assert.equal(ev.delta, leo[0].points);
  assert.equal(complete(board, clock, leo[0].id), null, "no double points on the same day");
  assert.equal(isDue(leo[0], "2026-09-01"), false);
  for (const c of leo.filter((c) => c.cadence === "daily")) complete(board, clock, c.id);
  assert.equal(streak(board, "c_leo", "2026-09-01"), 1);
  const cheap = board.rewards.find((r) => r.cost <= balance(board, "c_leo"));
  const expensive = board.rewards.find((r) => r.cost > balance(board, "c_leo"))!;
  assert.equal(claim(board, clock, "c_leo", expensive.id), null);
  if (cheap) assert.ok(claim(board, clock, "c_leo", cheap.id));
});

test("the excursion creates a chore Ava can own, and the brief speaks in the first person", async () => {
  await ingest(state, { channel: "email", from: "office@leichhardtps.nsw.edu.au", subject: "Year 6 Excursion – Taronga Zoo – Thursday 10 September", body: "Year 6 will visit Taronga Zoo on Thursday 10 September. Students depart at 8:15am. The cost is $38. Please complete the permission note by Friday 4 September. Students should bring a packed lunch and a hat." });
  const chore = state.chores.chores.find((c) => c.source === "agent")!;
  assert.equal(chore.childId, "c_ava");
  assert.match(chore.title, /Pack your own bag/);
  const brief = composeBrief(state);
  assert.match(brief.decide[0].narrative, /^I've put .* on the calendar, paid \$38 to Leichhardt Public School and set a reminder to pack .*\. I just need your signature\.$/);
  assert.match(brief.headline, /^One thing needs you tonight\./);
  const script = templateScript(state, brief);
  assert.match(script, /Hi Priya\./);
});
