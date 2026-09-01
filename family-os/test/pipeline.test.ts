import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createState, type State } from "../src/core/state.ts";
import { fixedClock, resetIds } from "../src/core/time.ts";
import { seedHousehold } from "../src/demo/household.ts";
import { demoInbox, DEMO_NOW } from "../src/demo/inbox.ts";
import { ingest, decide } from "../src/orchestrator.ts";
import { composeBrief } from "../src/agents/brief.ts";
import { trustFor, dispose } from "../src/core/trust.ts";
import { transition } from "../src/core/ledger.ts";

let state: State;
beforeEach(async () => {
  resetIds();
  state = createState(seedHousehold(), fixedClock(DEMO_NOW));
  for (const raw of demoInbox) await ingest(state, raw);
});

test("eight inputs compress to four decisions", () => {
  const b = composeBrief(state);
  assert.equal(b.compression.signals, 8);
  assert.equal(b.compression.decisions, 4);
  assert.equal(b.done.length, 1);
  assert.equal(b.later.length, 2);
  assert.equal(b.fyi.length, 1);
});

test("coach reschedule is handled end to end: footy moved, Tom drives, Priya keeps swimming", () => {
  const footy = state.calendar.find((e) => e.sourceId === "s_footy" && e.start.startsWith("2026-09-05"))!;
  assert.equal(footy.start, "2026-09-05T10:30");
  assert.equal(footy.end, "2026-09-05T11:30");
  assert.equal(footy.driverId, "p_tom");
  const swim = state.calendar.find((e) => e.sourceId === "s_swim" && e.start.startsWith("2026-09-05"))!;
  assert.equal(swim.driverId, "p_priya");
  const entry = state.ledger.find((e) => e.kind === "schedule_change")!;
  assert.equal(entry.state, "executed");
});

test("excursion: fee auto-paid under cap, signature stays with the parent", () => {
  const entry = state.ledger.find((e) => e.kind === "permission_request")!;
  const p = state.proposals.find((p) => p.id === entry.proposalId)!;
  const pay = p.actions.find((a) => a.cls === "payment")!;
  const sign = p.actions.find((a) => a.cls === "sign_form")!;
  assert.equal(entry.dispositions.find((d) => d.actionId === pay.id)?.disposition, "executed");
  assert.equal(entry.dispositions.find((d) => d.actionId === sign.id)?.disposition, "staged");
  assert.equal(entry.state, "awaiting_decision");
  assert.equal(state.spend.reduce((a, s) => a + s.amount, 0), 38);
});

test("co-parent message: neutral counter-proposal at 5:30pm, never auto-sent, alternatives offered", () => {
  const entry = state.ledger.find((e) => e.kind === "coparent_message")!;
  const p = state.proposals.find((p) => p.id === entry.proposalId)!;
  const reply = p.actions.find((a) => a.cls === "coparent_reply")!;
  assert.match(reply.detail, /5:30pm/);
  assert.doesNotMatch(reply.detail, /typical|AGAIN/i);
  assert.equal(entry.dispositions.find((d) => d.actionId === reply.id)?.disposition, "suggested");
  assert.equal(state.drafts.length, 0);
  assert.equal(p.alternatives.length, 2);
  assert.ok(p.flags.some((f) => /Hostile tone/.test(f.message)));
});

test("invitation: RSVP states the allergy, gift within cap, guardian lets it through", () => {
  const entry = state.ledger.find((e) => e.kind === "invitation")!;
  const p = state.proposals.find((p) => p.id === entry.proposalId)!;
  const rsvp = p.actions.find((a) => a.cls === "outbound_message")!;
  assert.match(rsvp.detail, /allergy/);
  const gift = p.actions.find((a) => a.cls === "purchase")!;
  assert.equal(gift.amount, 30);
  assert.ok(!p.flags.some((f) => f.level === "block"));
});

test("registration: enrolment suggested, fits activity cap, parked for later", () => {
  const entry = state.ledger.find((e) => e.kind === "registration")!;
  assert.equal(entry.state, "scheduled");
  const p = state.proposals.find((p) => p.id === entry.proposalId)!;
  assert.ok(p.flags.some((f) => /Fits the 2-activity cap/.test(f.message)));
  assert.ok(p.rationale.some((r) => /Leo lists cricket/.test(r)));
});

test("approving executes staged actions and climbs the trust ladder", () => {
  const entry = state.ledger.find((e) => e.kind === "invitation")!;
  decide(state, entry.id, "approve");
  assert.equal(entry.state, "executed");
  assert.equal(state.drafts.filter((d) => d.status === "sent").length, 1);
  assert.equal(trustFor(state.trust, "outbound_message").approvals, 1);
  // Two more approvals of outbound messages earn a promotion offer.
  const appt = state.ledger.find((e) => e.kind === "appointment")!;
  decide(state, appt.id, "approve");
  assert.equal(trustFor(state.trust, "outbound_message").approvals, 2);
});

test("approving an alternative runs the swap instead", () => {
  const entry = state.ledger.find((e) => e.kind === "coparent_message")!;
  decide(state, entry.id, "approve", 1);
  assert.match(state.drafts[0].text, /usual 6pm/);
  assert.equal(entry.state, "executed");
});

test("declining steps trust down and records an override", () => {
  const entry = state.ledger.find((e) => e.kind === "permission_request")!;
  const before = trustFor(state.trust, "sign_form").level;
  decide(state, entry.id, "decline");
  assert.equal(entry.state, "declined");
  assert.equal(trustFor(state.trust, "sign_form").overrides, 1);
  assert.equal(trustFor(state.trust, "sign_form").level, before); // pinned, so no demotion
});

test("payment disposition respects cap and payee verification", () => {
  const base = { id: "a", cls: "payment" as const, title: "", detail: "", agent: "t" };
  assert.equal(dispose(state.trust, { ...base, amount: 20, payee: "x" }, { verifiedPayee: true }).disposition, "executed");
  assert.equal(dispose(state.trust, { ...base, amount: 80, payee: "x" }, { verifiedPayee: true }).disposition, "staged");
  assert.equal(dispose(state.trust, { ...base, amount: 20, payee: "x" }, { verifiedPayee: false }).disposition, "staged");
});

test("ledger refuses impossible transitions", () => {
  const entry = state.ledger.find((e) => e.kind === "fyi")!;
  assert.throws(() => transition(state.clock, entry, "executed", "parent", "nope"));
});

test("a dated game with a child becomes an event with transport, not FYI", async () => {
  const r = await ingest(state, { channel: "whatsapp", from: "Netball team manager", body: "The U12s are through to the grand final, Saturday 12 September 9am at Balmain Netball Courts. Please arrive by 8:30am." });
  assert.equal(r.signal.kind, "event");
  assert.deepEqual(r.signal.extracted.childIds, ["c_ava"]);
  assert.equal(r.signal.extracted.when?.start, "2026-09-12T09:00");
  assert.ok(state.calendar.some((e) => e.sourceId === r.signal.id && e.driverId));
});

test("a fresh unknown message still lands somewhere sensible", async () => {
  const r = await ingest(state, { channel: "sms", from: "Smile Dental", body: "Leo's check-up is Monday 14 September at 4pm. Reply YES to confirm." });
  assert.equal(r.signal.kind, "appointment");
  assert.deepEqual(r.signal.extracted.childIds, ["c_leo"]);
  assert.equal(r.signal.extracted.when?.start, "2026-09-14T16:00");
  assert.equal(r.entry.state, "awaiting_decision");
});
