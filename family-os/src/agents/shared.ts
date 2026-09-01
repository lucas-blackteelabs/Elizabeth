import type { Action, ActionClass, Alternative, Flag } from "../core/types.ts";
import { newId } from "../core/time.ts";

/** What every specialist hands back to the orchestrator. */
export interface AgentOutput {
  actions: Action[];
  alternatives: Alternative[];
  flags: Flag[];
  rationale: string[];
  summary?: string;
}

export function empty(): AgentOutput {
  return { actions: [], alternatives: [], flags: [], rationale: [] };
}

export function action(agent: string, cls: ActionClass, title: string, detail: string, extra: Partial<Action> = {}): Action {
  return { id: newId("act"), cls, title, detail, agent, ...extra };
}

export function merge(...outs: AgentOutput[]): AgentOutput {
  return outs.reduce(
    (acc, o) => ({
      actions: [...acc.actions, ...o.actions],
      alternatives: [...acc.alternatives, ...o.alternatives],
      flags: [...acc.flags, ...o.flags],
      rationale: [...acc.rationale, ...o.rationale],
      summary: o.summary ?? acc.summary,
    }),
    empty(),
  );
}
