import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSignal, analyseTone, extractDates } from "../src/agents/intake.ts";
import { seedHousehold } from "../src/demo/household.ts";
import { demoInbox, DEMO_NOW } from "../src/demo/inbox.ts";
import { fixedClock } from "../src/core/time.ts";

const h = seedHousehold();
const clock = fixedClock(DEMO_NOW);
const parsed = demoInbox.map((raw) => parseSignal(raw, h, clock));

test("classifies every demo input without an LLM", () => {
  assert.deepEqual(parsed.map((s) => s.kind), ["permission_request", "schedule_change", "invitation", "appointment", "purchase_need", "coparent_message", "registration", "fyi"]);
});

test("excursion: Year 6 maps to Ava, window, fee, deadline, items", () => {
  const ex = parsed[0].extracted;
  assert.deepEqual(ex.childIds, ["c_ava"]);
  assert.deepEqual(ex.when, { start: "2026-09-10T08:15", end: "2026-09-10T15:00" });
  assert.equal(ex.deadline, "2026-09-04T00:00");
  assert.equal(ex.amount, 38);
  assert.equal(ex.placeId, "pl_zoo");
  assert.deepEqual(ex.items, ["packed lunch", "hat", "refillable water bottle"]);
  assert.deepEqual(ex.requires, ["signature", "payment", "item"]);
});

test("coach message: U8s resolves to Leo, moved-from time captured", () => {
  const ex = parsed[1].extracted;
  assert.deepEqual(ex.childIds, ["c_leo"]);
  assert.equal(ex.when?.start, "2026-09-05T10:30");
  assert.equal(ex.previousWhen?.start, "2026-09-05T09:00");
  assert.equal(ex.placeId, "pl_jubilee");
});

test("invitation: range time, RSVP contact, deadline, socks", () => {
  const ex = parsed[2].extracted;
  assert.deepEqual(ex.when, { start: "2026-09-13T14:00", end: "2026-09-13T16:00" });
  assert.equal(ex.deadline, "2026-09-08T00:00");
  assert.deepEqual(ex.contact, { name: "Jess", phone: "0433 222 333" });
  assert.deepEqual(ex.items, ["grip socks"]);
});

test("appointment: 45-minute default and things to bring", () => {
  const ex = parsed[3].extracted;
  assert.deepEqual(ex.childIds, ["c_maya"]);
  assert.deepEqual(ex.when, { start: "2026-09-09T15:15", end: "2026-09-09T16:00" });
  assert.deepEqual(ex.items, ["Blue Book", "Medicare card"]);
  assert.ok(ex.requires.includes("reply"));
});

test("uniform email: both school children, deadline, no event", () => {
  const ex = parsed[4].extracted;
  assert.deepEqual(ex.childIds, ["c_ava", "c_leo"]);
  assert.equal(ex.deadline, "2026-09-25T00:00");
  assert.equal(ex.when, undefined);
});

test("co-parent: hostile tone stripped to facts, 'by 5pm this Friday' is an event not a deadline", () => {
  const ex = parsed[5].extracted;
  assert.equal(ex.tone?.hostile, true);
  assert.equal(ex.when?.start, "2026-09-04T17:00");
  assert.equal(ex.deadline, undefined);
  assert.match(ex.tone!.neutralised, /homework folder was not sent/);
  assert.doesNotMatch(ex.tone!.neutralised, /AGAIN|typical/i);
});

test("registration: age range picks Leo, season start date preferred over 'Saturday mornings'", () => {
  const ex = parsed[6].extracted;
  assert.deepEqual(ex.childIds, ["c_leo"]);
  assert.deepEqual(ex.when, { start: "2026-10-17T08:30", end: "2026-10-17T10:00" });
  assert.equal(ex.deadline, "2026-10-01T00:00");
  assert.deepEqual(ex.ageRange, { min: 5, max: 8 });
  assert.ok(ex.otherDates.includes("2026-12-12T00:00"));
});

test("date parsing handles many shapes relative to a fixed now", () => {
  const days = (t: string) => extractDates(t, DEMO_NOW).map((d) => d.day);
  assert.deepEqual(days("see you Sat"), ["2026-09-05T00:00"]);
  assert.deepEqual(days("on 10/9"), ["2026-09-10T00:00"]);
  assert.deepEqual(days("Sept 10th, 2026"), ["2026-09-10T00:00"]);
  assert.deepEqual(days("15 Jan"), ["2027-01-15T00:00"]);
  assert.deepEqual(days("tomorrow at 5"), ["2026-09-02T00:00"]);
});

test("tone analysis is calm on a calm message", () => {
  const t = analyseTone("Hi, can we swap weekends on 19 Sep? Happy either way.", "Daniel", "Ava");
  assert.equal(t.hostile, false);
});
