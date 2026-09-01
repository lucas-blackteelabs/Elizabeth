import type { Signal } from "../core/types.ts";
import type { State } from "../core/state.ts";
import { trace } from "../core/state.ts";
import { addDays, withTime, weekdayOf } from "../core/time.ts";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Turns what is coming up into something a child can own. Only for children
 * old enough, only for things they can genuinely do, and never more than one
 * per signal so the board stays light.
 */
export function proposeChore(state: State, signal: Signal): void {
  const ex = signal.extracted;
  if (!ex.when) return;
  for (const cid of ex.childIds) {
    const kid = state.household.people.find((p) => p.id === cid);
    if (!kid || (kid.age ?? 0) < 7) continue;
    let title: string | undefined;
    let points = 5;
    if (signal.kind === "permission_request" && ex.items.length) {
      title = `Pack your own bag for ${ex.title.replace(/^[^:]+:\s*/, "").toLowerCase()}: ${ex.items.join(", ")}`;
      points = 8;
    } else if (signal.kind === "invitation") {
      title = "Write the birthday card and wrap the present";
      points = 5;
    } else if (signal.kind === "coparent_message" && /folder|homework|bag/i.test(signal.raw.body)) {
      title = "Put your homework folder in your bag for the weekend";
      points = 5;
    } else if (signal.kind === "schedule_change" || signal.kind === "event") {
      title = `Get your kit ready for ${DAYS[weekdayOf(ex.when.start)]}`;
      points = 4;
    }
    if (!title) continue;
    if (state.chores.chores.some((c) => c.sourceId === signal.id && c.childId === cid)) continue;
    state.chores.chores.push({ id: `ch_${signal.id}_${cid}`, childId: cid, title, points, cadence: "once", dueAt: withTime(addDays(ex.when.start, -1), "19:00"), doneOn: [], source: "agent", sourceId: signal.id });
    trace(state, signal.id, "chores", "propose", `${kid.name}: "${title}" (+${points})`);
  }
}
