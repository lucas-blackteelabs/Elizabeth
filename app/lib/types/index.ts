export type AuthTokens = { accessToken: string; refreshToken: string };

export type Role = 'PARENT' | 'CHILD' | 'COPARENT' | 'CARER';
export type Person = {
  id: string; name: string; role: Role; age?: number; yearLevel?: string; school?: string;
  allergies: string[]; interests: string[]; unavailable: { day: number; start: string; end: string; label: string; flexible: boolean }[];
  custodyPattern?: string;
};
export type Place = { id: string; name: string; suburb: string; travelMinutesFromHome: number; verifiedPayee: boolean };
export type StandingCommitment = { id: string; personId: string; title: string; day: number; start: string; end: string; placeId: string; seasonTo?: string };
export type Policy = { id: string; kind: string; title: string; description: string; params: Record<string, unknown>; enabled: boolean };
export type ActionClass = 'CALENDAR_WRITE' | 'REMINDER' | 'SIGN_FORM' | 'PAYMENT' | 'OUTBOUND_MESSAGE' | 'COPARENT_REPLY' | 'PURCHASE' | 'ENROLMENT';
export type TrustSetting = { cls: ActionClass; level: number; approvals: number; overrides: number; pinned: boolean; maxAmount?: number };
export type IcsFeed = { url: string; label: string; childId?: string; lastSync?: string; events: number };
export type Household = {
  id: string; name: string; homeSuburb: string; timezone: string; people: Person[]; places: Place[]; standing: StandingCommitment[];
  policies: Policy[]; trust: TrustSetting[]; values: string[]; promotionsOffered: string[]; icsFeeds: IcsFeed[]; demo: boolean; onboarded: boolean; demoNow?: string;
};
export type HouseholdResponse = { household: Household; aiReady: boolean; aiModel: string };

export type Disposition = 'EXECUTED' | 'STAGED' | 'SUGGESTED' | 'OBSERVED';
export type LedgerState = 'DETECTED' | 'AWAITING_DECISION' | 'EXECUTED' | 'DECLINED' | 'SNOOZED' | 'SCHEDULED' | 'NOTED';
export type ActionView = { id: string; cls: ActionClass; title: string; detail: string; disposition: Disposition; amount?: number };
export type Alternative = { label: string; detail: string; actions: { id: string }[] };
export type Flag = { level: 'INFO' | 'WARN' | 'BLOCK'; policyId?: string; message: string };
export type BriefItem = {
  ledgerId: string; signalId: string; title: string; summary: string; narrative: string; kind: string; state: LedgerState; children: string[]; dueLabel?: string;
  actions: ActionView[]; alternatives: Alternative[]; flags: Flag[]; why: string[]; originalMessage?: string;
};
export type Brief = { generatedAt: string; headline: string; compression: { signals: number; decisions: number; automated: number; deferred: number; fyi: number }; decide: BriefItem[]; done: BriefItem[]; later: BriefItem[]; fyi: BriefItem[] };

export type CalendarEvent = { id: string; title: string; personIds: string[]; start: string; end: string; placeId?: string; locationText?: string; driverId?: string; source: string; notes: string[] };
export type Reminder = { id: string; at: string; personIds: string[]; text: string };

export type Channel = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PORTAL' | 'PDF' | 'VOICE' | 'MANUAL';
export type RawMessage = { channel: Channel; from: string; subject?: string | null; body: string };
export type Signal = { id: string; receivedAt: string; raw: RawMessage; kind: string; confidence: number; parser: string; extracted: { title: string; childIds: string[] } };
export type IngestResult = { signal: Signal; entry: { id: string; state: LedgerState } };

export type Chore = { id: string; childId: string; title: string; points: number; cadence: 'DAILY' | 'WEEKLY' | 'ONCE'; dueAt?: string; doneOn: string[]; source: string };
export type Reward = { id: string; title: string; cost: number };
export type Claim = { id: string; childId: string; rewardId: string; approved: boolean };
export type BoardView = { board: { chores: Chore[]; rewards: Reward[]; claims: Claim[] }; perChild: { childId: string; name: string; balance: number; week: number; streak: number; due: string[]; doneToday: string[] }[] };

export type Draft = {
  familyName: string; homeSuburb: string;
  adults: { name: string; role: string; workPattern?: string | null; drives?: boolean | null }[];
  children: { name: string; age?: number | null; yearLevel?: string | null; school?: string | null; allergies: string[]; interests: string[] }[];
  activities: { childName: string; title: string; day?: string | null; start?: string | null; end?: string | null; place?: string | null }[];
  places: { name: string }[]; values: string[]; notes: string[];
};
export type DraftResponse = { draft: Draft; source: string; suggestedPolicies: Policy[] };
