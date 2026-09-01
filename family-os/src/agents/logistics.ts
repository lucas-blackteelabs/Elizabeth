import type { Signal } from "../core/types.ts";
import type { State } from "../core/state.ts";
import { trace, personName, placeName } from "../core/state.ts";
import { fmtTime } from "../core/time.ts";
import { findConflicts, planDriver } from "../core/calendar.ts";
import { action, empty, type AgentOutput } from "./shared.ts";
import type { SchedulePlan } from "./scheduler.ts";

const AGENT = "logistics";

/** Who drives, and what has to shuffle so that everyone gets where they need to be. */
export function logistics(state: State, signal: Signal, plan: SchedulePlan): AgentOutput {
  const out = empty();
  const ev = plan.candidate;
  if (!ev || !plan.needsTransport || signal.kind === "coparent_message") return out;
  const h = state.household;
  const childIds = ev.personIds;
  const preferred = plan.moveOf?.driverId ?? h.standing.find((s) => childIds.includes(s.personId))?.usualDriverId;
  const dp = planDriver(h, state.calendar, { start: ev.start, end: ev.end, placeId: ev.placeId, childIds, preferredDriverId: preferred, ignoreEventId: plan.moveOf?.id });
  out.rationale.push(...dp.rationale);

  if (dp.driverId) {
    const changed = plan.moveOf && plan.moveOf.driverId && plan.moveOf.driverId !== dp.driverId;
    const title = changed ? `${personName(state, dp.driverId)} drives instead of ${personName(state, plan.moveOf!.driverId)}` : `${personName(state, dp.driverId)} drives`;
    out.actions.push(action(AGENT, "calendar_write", title, `${childIds.map((c) => personName(state, c)).join(" & ")} to ${placeName(state, ev.placeId) ?? ev.locationText ?? "the event"}, leave ${fmtTime(departure(state, ev.start, ev.placeId))}.`, { payload: { op: "assign_driver", eventId: ev.id, driverId: dp.driverId } }));
    // If the usual driver was displaced, say what they are still doing.
    if (changed) {
      const still = state.calendar.filter((e) => e.driverId === plan.moveOf!.driverId && e.start.slice(0, 10) === ev.start.slice(0, 10) && e.id !== plan.moveOf!.id);
      for (const s of still) out.rationale.push(`${personName(state, s.driverId)} keeps ${s.title} (${fmtTime(s.start)}).`);
      // Offer the mirror-image swap.
      for (const s of still) {
        const conflicts = findConflicts(h, state.calendar, { start: s.start, end: s.end, personIds: [], driverId: dp.driverId, placeId: s.placeId, ignoreEventId: s.id });
        if (!conflicts.length) {
          out.alternatives.push({
            label: `Swap: ${personName(state, dp.driverId)} takes ${s.title}, ${personName(state, plan.moveOf!.driverId)} keeps ${ev.title}`,
            detail: `${personName(state, dp.driverId)} drives ${s.personIds.map((p) => personName(state, p)).join(" & ")} at ${fmtTime(s.start)}.`,
            actions: [
              action(AGENT, "calendar_write", `${personName(state, dp.driverId)} drives ${s.title}`, `${fmtTime(s.start)} at ${placeName(state, s.placeId)}`, { payload: { op: "assign_driver", eventId: s.id, driverId: dp.driverId } }),
              action(AGENT, "calendar_write", `${personName(state, plan.moveOf!.driverId)} keeps ${ev.title}`, `${fmtTime(ev.start)} at ${placeName(state, ev.placeId)}`, { payload: { op: "assign_driver", eventId: ev.id, driverId: plan.moveOf!.driverId } }),
            ],
          });
        }
      }
    }
  } else {
    out.flags.push({ level: "warn", message: "Nobody is free to drive without moving something." });
    for (const alt of dp.alternatives) {
      out.alternatives.push({ label: alt.reason, detail: `Assign ${personName(state, alt.driverId)}.`, actions: [action(AGENT, "calendar_write", `${personName(state, alt.driverId)} drives`, alt.reason, { payload: { op: "assign_driver", eventId: ev.id, driverId: alt.driverId } })] });
    }
    const custody = h.policies.find((p) => p.kind === "custody" && p.enabled);
    const carer = h.people.find((p) => p.role === "carer") ?? (custody && childIds.includes(String(custody.params.childId)) ? h.people.find((p) => p.id === custody.params.coparentId) : undefined);
    if (carer) out.alternatives.push({ label: `Ask ${carer.name}`, detail: `Draft a message asking ${carer.name} to cover the drive.`, actions: [action(AGENT, "outbound_message", `Ask ${carer.name} to drive`, `Could you take ${childIds.map((c) => personName(state, c)).join(" & ")} at ${fmtTime(ev.start)}?`, { payload: { to: carer.name, channel: "sms" } })] });
  }
  trace(state, signal.id, AGENT, "drive", out.rationale.join(" "));
  return out;
}

function departure(state: State, start: string, placeId?: string): string {
  const travel = state.household.places.find((p) => p.id === placeId)?.travelMinutesFromHome ?? 15;
  const d = new Date(start);
  d.setMinutes(d.getMinutes() - travel);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
