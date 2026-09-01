import fs from "node:fs";
import path from "node:path";
import type { State } from "./state.ts";
import type { Clock } from "./time.ts";

/** Plain JSON persistence. One household, one file. Good enough for a prototype that has to survive restarts. */
const FILE = path.join(process.cwd(), "data", "state.json");

type Persisted = Omit<State, "clock">;

export function saveState(state: State): void {
  const { clock: _clock, ...rest } = state;
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(rest));
  fs.renameSync(tmp, FILE);
}

export function loadState(clock: Clock): State | null {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8")) as Persisted;
    if (!data.household || !data.ledger) return null;
    return { ...data, clock, chores: data.chores ?? { chores: [], rewards: [], points: [], claims: [] }, connections: data.connections ?? {} };
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    fs.unlinkSync(FILE);
  } catch {
    /* nothing to clear */
  }
}
