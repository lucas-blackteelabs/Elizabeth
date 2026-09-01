import type { LocalDateTime } from "./time.ts";

export type Id = string;

// ───────────────────────────── Household graph ─────────────────────────────

export type Role = "parent" | "child" | "coparent" | "carer";

export interface AvailabilityBlock {
  day: number; // 0 = Sunday
  start: string; // "HH:mm"
  end: string;
  label: string;
  flexible?: boolean; // can be moved if the household needs it
}

export interface Person {
  id: Id;
  name: string;
  aliases?: string[];
  role: Role;
  householdId: Id; // which residence they belong to (co-parents have their own)
  age?: number;
  birthDate?: string; // YYYY-MM-DD
  yearLevel?: string;
  school?: string;
  allergies?: string[];
  interests?: string[];
  sizes?: Record<string, { size: string; recordedOn: string }>;
  unavailable?: AvailabilityBlock[]; // for adults: work, standing commitments
  canDrive?: boolean;
  phone?: string;
  email?: string;
  custodyPattern?: string; // free-text description for co-parents
}

export interface Place {
  id: Id;
  name: string;
  suburb: string;
  aliases?: string[];
  travelMinutesFromHome: number;
  verifiedPayee?: boolean; // school, club, clinic with a known payment relationship
}

export interface Vehicle {
  id: Id;
  name: string;
  seats: number;
}

export type ActivityCategory = "sport" | "creative" | "academic" | "health" | "social" | "school" | "care";

export interface StandingCommitment {
  id: Id;
  personId: Id;
  title: string;
  category: ActivityCategory;
  day: number;
  start: string;
  end: string;
  placeId: Id;
  season?: { from: string; to: string }; // YYYY-MM-DD bounds
  costPerTerm?: number;
  usualDriverId?: Id;
}

export type PolicyKind =
  | "transit_radius"
  | "evening_cutoff"
  | "allergen"
  | "max_activities"
  | "one_per_category"
  | "budget"
  | "auto_pay_cap"
  | "gift_cap"
  | "quiet_block"
  | "custody";

export interface Policy {
  id: Id;
  kind: PolicyKind;
  title: string;
  description: string;
  params: Record<string, unknown>;
  enabled: boolean;
}

export interface Household {
  id: Id;
  name: string;
  homeSuburb: string;
  timezone: string;
  people: Person[];
  places: Place[];
  vehicles: Vehicle[];
  standing: StandingCommitment[];
  policies: Policy[];
  values: string[]; // what the parents said they want to foster
  preferences: { brands?: string[]; giftIdeas?: string[]; shops?: string[] };
}

// ───────────────────────────── Signals (inputs) ─────────────────────────────

export type Channel = "email" | "whatsapp" | "sms" | "portal" | "pdf" | "voice" | "manual";

export interface RawMessage {
  channel: Channel;
  from: string;
  subject?: string;
  body: string;
  receivedAt?: LocalDateTime;
}

export type SignalKind =
  | "permission_request"
  | "schedule_change"
  | "invitation"
  | "appointment"
  | "purchase_need"
  | "registration"
  | "coparent_message"
  | "event"
  | "fyi";

export type Requirement = "signature" | "payment" | "rsvp" | "reply" | "purchase" | "transport" | "item" | "decision";

export interface TimeWindow {
  start: LocalDateTime;
  end?: LocalDateTime;
  allDay?: boolean;
}

export interface Extracted {
  title: string;
  childIds: Id[];
  when?: TimeWindow;
  previousWhen?: TimeWindow;
  deadline?: LocalDateTime;
  locationText?: string;
  placeId?: Id;
  travelMinutes?: number;
  amount?: number;
  payee?: string;
  requires: Requirement[];
  items: string[]; // things to bring / buy
  contact?: { name?: string; phone?: string };
  interestTags: string[];
  ageRange?: { min: number; max: number };
  tone?: { hostile: boolean; score: number; facts: string[]; neutralised: string };
  otherDates: string[]; // other explicit dates in the message (season end, term start)
  notes: string[];
}

export interface Signal {
  id: Id;
  receivedAt: LocalDateTime;
  raw: RawMessage;
  kind: SignalKind;
  confidence: number; // 0..1
  extracted: Extracted;
  parser: "rules" | "llm";
}

// ───────────────────────────── Proposals (agent outputs) ─────────────────────────────

export type ActionClass =
  | "calendar_write"
  | "reminder"
  | "sign_form"
  | "payment"
  | "outbound_message"
  | "coparent_reply"
  | "purchase"
  | "enrolment";

export interface Action {
  id: Id;
  cls: ActionClass;
  title: string;
  detail: string;
  agent: string;
  amount?: number;
  payee?: string;
  payload?: Record<string, unknown>;
}

export type Urgency = "now" | "this_week" | "later" | "fyi";

export interface Flag {
  level: "info" | "warn" | "block";
  policyId?: Id;
  message: string;
}

export interface Alternative {
  label: string;
  detail: string;
  actions: Action[];
}

export interface Proposal {
  id: Id;
  signalId: Id;
  agent: string;
  title: string;
  summary: string;
  actions: Action[];
  alternatives: Alternative[];
  urgency: Urgency;
  dueAt?: LocalDateTime;
  flags: Flag[];
  rationale: string[];
}

// ───────────────────────────── Trust ladder ─────────────────────────────

/** 0 observe · 1 suggest · 2 prepare (stage for one tap) · 3 execute and notify · 4 autonomous */
export type TrustLevel = 0 | 1 | 2 | 3 | 4;

export interface TrustSetting {
  cls: ActionClass;
  level: TrustLevel;
  approvals: number; // consecutive approvals since last override
  overrides: number;
  pinned: boolean; // parent locked the level; no auto-promotion offers
  conditions?: { maxAmount?: number; verifiedPayeeOnly?: boolean };
}

export type Disposition = "executed" | "staged" | "suggested" | "observed";

// ───────────────────────────── Calendar & state ─────────────────────────────

export interface CalendarEvent {
  id: Id;
  title: string;
  personIds: Id[];
  start: LocalDateTime;
  end: LocalDateTime;
  placeId?: Id;
  locationText?: string;
  driverId?: Id;
  source: "standing" | "signal" | "ics";
  sourceId?: Id;
  notes?: string[];
}

export interface Reminder {
  id: Id;
  at: LocalDateTime;
  personIds: Id[];
  text: string;
  sourceId?: Id;
}

export type LedgerState = "detected" | "awaiting_decision" | "executed" | "declined" | "snoozed" | "scheduled" | "noted";

export interface LedgerEvent {
  at: LocalDateTime;
  state: LedgerState;
  by: "agent" | "parent";
  note: string;
}

export interface LedgerEntry {
  id: Id;
  signalId: Id;
  proposalId: Id;
  title: string;
  childIds: Id[];
  kind: SignalKind;
  state: LedgerState;
  urgency: Urgency;
  dueAt?: LocalDateTime;
  dispositions: { actionId: Id; disposition: Disposition }[];
  history: LedgerEvent[];
}

export interface TraceStep {
  at: LocalDateTime;
  signalId: Id;
  agent: string;
  step: string;
  detail: string;
}

export interface BriefItem {
  ledgerId: Id;
  signalId: Id;
  title: string;
  summary: string;
  narrative: string;
  kind: SignalKind;
  state: LedgerState;
  children: string[];
  dueLabel?: string;
  actions: { id: Id; cls: ActionClass; title: string; detail: string; disposition: Disposition; amount?: number }[];
  alternatives: Alternative[];
  flags: Flag[];
  why: string[];
}

export interface Brief {
  generatedAt: LocalDateTime;
  headline: string;
  compression: { signals: number; decisions: number; automated: number; deferred: number; fyi: number };
  decide: BriefItem[];
  done: BriefItem[];
  later: BriefItem[];
  fyi: BriefItem[];
}
