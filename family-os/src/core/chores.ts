import type { Household, Person } from "./types.ts";
import { dateOf, newId, type Clock, type LocalDateTime } from "./time.ts";

/**
 * Chores, points and rewards. Kids see a board; parents see a nudge in the
 * brief. Agents can propose one-off chores from what is coming up (pack your
 * own excursion bag) so the board stays connected to real life.
 */

export type Cadence = "daily" | "weekly" | "once";

export interface Chore {
  id: string;
  childId: string;
  title: string;
  points: number;
  cadence: Cadence;
  dueAt?: LocalDateTime; // for once
  doneOn: string[]; // dates YYYY-MM-DD
  source: "family" | "agent";
  sourceId?: string;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
}

export interface PointEvent {
  id: string;
  childId: string;
  at: LocalDateTime;
  delta: number;
  reason: string;
}

export interface Claim {
  id: string;
  childId: string;
  rewardId: string;
  at: LocalDateTime;
  approved: boolean;
}

export interface ChoreBoard {
  chores: Chore[];
  rewards: Reward[];
  points: PointEvent[];
  claims: Claim[];
}

export function emptyBoard(): ChoreBoard {
  return { chores: [], rewards: [], points: [], claims: [] };
}

/** Age-appropriate defaults. Deliberately few: the board should feel doable, not like a rota. */
export function defaultBoard(h: Household): ChoreBoard {
  const board = emptyBoard();
  for (const kid of h.people.filter((p) => p.role === "child")) {
    for (const [title, points, cadence] of defaultsFor(kid)) {
      board.chores.push({ id: newId("ch"), childId: kid.id, title, points, cadence, doneOn: [], source: "family" });
    }
  }
  board.rewards = [
    { id: newId("rw"), title: "Pick Friday movie night", cost: 30 },
    { id: newId("rw"), title: "Stay up 30 minutes later", cost: 40 },
    { id: newId("rw"), title: "$5 pocket money", cost: 50 },
    { id: newId("rw"), title: "Choose Sunday breakfast", cost: 25 },
  ];
  return board;
}

function defaultsFor(kid: Person): [string, number, Cadence][] {
  const age = kid.age ?? 8;
  if (age <= 5) return [["Put toys away", 2, "daily"], ["Help set the table", 3, "daily"], ["Books back on the shelf", 2, "weekly"]];
  if (age <= 9) return [["Pack your school bag", 5, "daily"], ["Feed the pet or water the plants", 3, "daily"], ["Tidy your room", 8, "weekly"], ["Set the table", 3, "daily"]];
  return [["Pack your own bag and lunchbox", 5, "daily"], ["Unload the dishwasher", 6, "daily"], ["Homework done before screens", 5, "daily"], ["Clean your room properly", 10, "weekly"]];
}

export function isDue(chore: Chore, day: string): boolean {
  if (chore.cadence === "once") return !chore.doneOn.length && (!chore.dueAt || dateOf(chore.dueAt) >= day);
  if (chore.cadence === "daily") return !chore.doneOn.includes(day);
  const week = weekKey(day);
  return !chore.doneOn.some((d) => weekKey(d) === week);
}

export function complete(board: ChoreBoard, clock: Clock, choreId: string): PointEvent | null {
  const chore = board.chores.find((c) => c.id === choreId);
  if (!chore) return null;
  const day = dateOf(clock.now());
  if (!isDue(chore, day)) return null;
  chore.doneOn.push(day);
  const ev: PointEvent = { id: newId("pt"), childId: chore.childId, at: clock.now(), delta: chore.points, reason: chore.title };
  board.points.push(ev);
  return ev;
}

export function undo(board: ChoreBoard, choreId: string, day: string): void {
  const chore = board.chores.find((c) => c.id === choreId);
  if (!chore) return;
  const i = chore.doneOn.lastIndexOf(day);
  if (i === -1) return;
  chore.doneOn.splice(i, 1);
  const j = [...board.points].reverse().findIndex((p) => p.childId === chore.childId && p.reason === chore.title && dateOf(p.at) === day);
  if (j !== -1) board.points.splice(board.points.length - 1 - j, 1);
}

export function balance(board: ChoreBoard, childId: string): number {
  return board.points.filter((p) => p.childId === childId).reduce((a, p) => a + p.delta, 0);
}

export function earnedThisWeek(board: ChoreBoard, childId: string, day: string): number {
  const week = weekKey(day);
  return board.points.filter((p) => p.childId === childId && p.delta > 0 && weekKey(dateOf(p.at)) === week).reduce((a, p) => a + p.delta, 0);
}

export function claim(board: ChoreBoard, clock: Clock, childId: string, rewardId: string): Claim | null {
  const reward = board.rewards.find((r) => r.id === rewardId);
  if (!reward || balance(board, childId) < reward.cost) return null;
  board.points.push({ id: newId("pt"), childId, at: clock.now(), delta: -reward.cost, reason: `Reward: ${reward.title}` });
  const c: Claim = { id: newId("cl"), childId, rewardId, at: clock.now(), approved: false };
  board.claims.push(c);
  return c;
}

export function streak(board: ChoreBoard, childId: string, day: string): number {
  // Consecutive days (ending today or yesterday) on which every daily chore was done.
  const daily = board.chores.filter((c) => c.childId === childId && c.cadence === "daily");
  if (!daily.length) return 0;
  let n = 0;
  const d = new Date(day);
  const allDone = (k: string) => daily.every((c) => c.doneOn.includes(k));
  if (!allDone(day)) d.setDate(d.getDate() - 1);
  for (;;) {
    const k = d.toISOString().slice(0, 10);
    if (!allDone(k)) break;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function weekKey(day: string): string {
  const d = new Date(day);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}
