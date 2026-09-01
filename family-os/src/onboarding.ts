import type { Household, Person, Policy, StandingCommitment, Place } from "./core/types.ts";
import { generateJson, geminiReady, type Schema } from "./llm/gemini.ts";
import { newId } from "./core/time.ts";

/**
 * Onboarding is a conversation, not a form. The parent describes the family in
 * their own words (or pastes one school email); the draft graph comes back for
 * a glance, not a data-entry session. Gemini does the heavy lifting; a rules
 * fallback keeps the flow working without a key.
 */

export interface HouseholdDraft {
  familyName: string;
  homeSuburb: string;
  adults: { name: string; role: "parent" | "coparent" | "carer"; workPattern?: string; drives?: boolean }[];
  children: { name: string; age?: number; yearLevel?: string; school?: string; allergies?: string[]; interests?: string[] }[];
  activities: { childName: string; title: string; day?: string; start?: string; end?: string; place?: string }[];
  places: { name: string; suburb?: string; travelMinutesFromHome?: number }[];
  values: string[];
  notes: string[];
}

const DRAFT_SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    familyName: { type: "STRING", description: "e.g. 'The Mahoneys'" },
    homeSuburb: { type: "STRING" },
    adults: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, role: { type: "STRING", enum: ["parent", "coparent", "carer"] }, workPattern: { type: "STRING", nullable: true }, drives: { type: "BOOLEAN", nullable: true } }, required: ["name", "role"] } },
    children: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, age: { type: "INTEGER", nullable: true }, yearLevel: { type: "STRING", nullable: true }, school: { type: "STRING", nullable: true }, allergies: { type: "ARRAY", items: { type: "STRING" } }, interests: { type: "ARRAY", items: { type: "STRING" } } }, required: ["name", "allergies", "interests"] } },
    activities: { type: "ARRAY", items: { type: "OBJECT", properties: { childName: { type: "STRING" }, title: { type: "STRING" }, day: { type: "STRING", nullable: true, description: "Monday..Sunday" }, start: { type: "STRING", nullable: true, description: "HH:mm" }, end: { type: "STRING", nullable: true }, place: { type: "STRING", nullable: true } }, required: ["childName", "title"] } },
    places: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, suburb: { type: "STRING", nullable: true }, travelMinutesFromHome: { type: "INTEGER", nullable: true } }, required: ["name"] } },
    values: { type: "ARRAY", items: { type: "STRING" }, description: "What the parents want for their kids, in their words" },
    notes: { type: "ARRAY", items: { type: "STRING" }, description: "Anything important that did not fit" },
  },
  required: ["familyName", "homeSuburb", "adults", "children", "activities", "places", "values", "notes"],
};

export async function draftHousehold(text: string): Promise<{ draft: HouseholdDraft; source: "gemini" | "rules" }> {
  if (geminiReady()) {
    try {
      const draft = await generateJson<HouseholdDraft>(text, DRAFT_SCHEMA, {
        system: "You are setting up a family logistics assistant. Read the parent's description (it may be casual, partial, or a pasted email) and extract the household. Do not invent people, schools or ages that are not stated or clearly implied. Estimate travelMinutesFromHome only when a suburb is given and the home suburb is known; otherwise leave it null. Keep names as written.",
        temperature: 0.1,
      });
      return { draft: tidy(draft), source: "gemini" };
    } catch (err) {
      console.warn(`[gemini] onboarding fell back to rules: ${(err as Error).message}`);
    }
  }
  return { draft: rulesDraft(text), source: "rules" };
}

function tidy(d: HouseholdDraft): HouseholdDraft {
  return { ...d, adults: d.adults ?? [], children: d.children ?? [], activities: d.activities ?? [], places: d.places ?? [], values: d.values ?? [], notes: d.notes ?? [] };
}

/** Good enough to keep onboarding moving without a key. */
export function rulesDraft(text: string): HouseholdDraft {
  const children: HouseholdDraft["children"] = [];
  for (const m of text.matchAll(/\b([A-Z][a-z]+)\s*(?:\(|,\s*|\s+is\s+|\s+who'?s\s+|\s+)(\d{1,2})\)?(?:\s*(?:yo|years? old|y\.o\.|,|\)))?/g)) {
    const age = Number(m[2]);
    if (age < 1 || age > 18 || children.some((c) => c.name === m[1])) continue;
    if (/^(Year|Grade|Term|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/.test(m[1])) continue;
    children.push({ name: m[1], age, allergies: [], interests: [] });
  }
  const adults: HouseholdDraft["adults"] = [];
  const me = /\b(?:I'?m|I am|my name is)\s+([A-Z][a-z]+)/.exec(text)?.[1];
  if (me) adults.push({ name: me, role: "parent", drives: true });
  const partner = /\b(?:my )?(?:partner|husband|wife)\s+(?:is\s+)?([A-Z][a-z]+)/.exec(text)?.[1];
  if (partner) adults.push({ name: partner, role: "parent", drives: true });
  const ex = /\b(?:my )?(?:ex|ex-husband|ex-wife|ex-partner|co-parent)\s*(?:,|is)?\s*([A-Z][a-z]+)/.exec(text)?.[1] ?? /\b[A-Z][a-z]+'s (?:dad|mum|mom|father|mother)\s+(?:is\s+)?([A-Z][a-z]+)/.exec(text)?.[1];
  if (ex && !adults.some((a) => a.name === ex)) adults.push({ name: ex, role: "coparent", drives: true });
  for (const m of text.matchAll(/\b([A-Z][a-z]+)\s+(?:is|has)\s+(?:allergic to|an? [\w ]*allergy to)\s+([a-z ]+?)(?:[.,;]|$)/gi)) {
    const kid = children.find((c) => c.name.toLowerCase() === m[1].toLowerCase());
    if (kid) (kid.allergies ??= []).push(...m[2].split(/ and |, /).map((s) => s.trim()));
  }
  const schoolRe = /\b([A-Z][A-Za-z']+(?:\s+[A-Z][A-Za-z']+)*\s+(?:Public School|Primary School|Primary|Public|School|College|Grammar|Preschool|Kindergarten|Kindy|Childcare))\b/g;
  const schools = [...new Set([...text.matchAll(schoolRe)].map((m) => m[1]))];
  for (const kid of children) {
    const near = new RegExp(`${kid.name}[^.]*?(${schools.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`).exec(text);
    if (near) kid.school = near[1];
    const year = new RegExp(`${kid.name}[^.]*?\\b(Year \\d{1,2}|Kindy|Kindergarten|Preschool|Prep)\\b`, "i").exec(text);
    if (year) kid.yearLevel = year[1];
  }
  const suburb = /\b(?:in|from|live in|based in)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/.exec(text)?.[1] ?? "";
  const interestsRe = /\b(football|soccer|cricket|swimming|piano|guitar|netball|drawing|art|dance|ballet|coding|chess|tennis|gymnastics|surfing|rugby|basketball|drama|LEGO|reading)\b/gi;
  for (const kid of children) {
    const seg = text.slice(text.indexOf(kid.name), text.indexOf(kid.name) + 220);
    kid.interests = [...new Set([...seg.matchAll(interestsRe)].map((m) => m[1].toLowerCase()))];
  }
  const familyName = adults[0] ? `${adults[0].name}'s family` : children[0] ? `${children[0].name}'s family` : "Our family";
  return { familyName, homeSuburb: suburb, adults, children, activities: [], places: schools.map((s) => ({ name: s })), values: [], notes: [] };
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function draftToHousehold(d: HouseholdDraft): Household {
  const hid = "hh_" + d.familyName.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
  const people: Person[] = [];
  for (const a of d.adults) {
    const id = `p_${slug(a.name)}`;
    people.push({ id, name: a.name, role: a.role, householdId: a.role === "coparent" ? `${hid}_${slug(a.name)}` : hid, canDrive: a.drives ?? true, unavailable: workBlocks(a.workPattern), custodyPattern: a.role === "coparent" ? a.workPattern : undefined });
  }
  for (const c of d.children) {
    people.push({ id: `c_${slug(c.name)}`, name: c.name, role: "child", householdId: hid, age: c.age, yearLevel: c.yearLevel, school: c.school, allergies: c.allergies?.length ? c.allergies : undefined, interests: c.interests, sizes: {} });
  }
  const places: Place[] = [{ id: "pl_home", name: "Home", suburb: d.homeSuburb, travelMinutesFromHome: 0 }];
  const addPlace = (name: string, suburb?: string, mins?: number, verified?: boolean) => {
    const existing = places.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const p: Place = { id: `pl_${slug(name)}`, name, suburb: suburb ?? d.homeSuburb, travelMinutesFromHome: mins ?? 15, verifiedPayee: verified };
    places.push(p);
    return p;
  };
  for (const c of d.children) if (c.school) addPlace(c.school, undefined, 8, true);
  for (const p of d.places) addPlace(p.name, p.suburb, p.travelMinutesFromHome ?? undefined);
  const standing: StandingCommitment[] = [];
  for (const a of d.activities) {
    const kid = people.find((p) => p.role === "child" && p.name.toLowerCase() === a.childName.toLowerCase());
    if (!kid) continue;
    const day = a.day ? DAYS.indexOf(a.day.toLowerCase()) : -1;
    if (day === -1 || !a.start) continue;
    const place = a.place ? addPlace(a.place) : places[0];
    standing.push({ id: `s_${slug(kid.name)}_${slug(a.title)}`, personId: kid.id, title: a.title, category: /piano|music|art|drama|dance|drawing|guitar/i.test(a.title) ? "creative" : /tutor|math|reading|kumon/i.test(a.title) ? "academic" : "sport", day, start: a.start, end: a.end ?? addHour(a.start), placeId: place.id, usualDriverId: people.find((p) => p.role === "parent")?.id });
  }
  return {
    id: hid,
    name: d.familyName,
    homeSuburb: d.homeSuburb,
    timezone: "Australia/Sydney",
    people,
    places,
    vehicles: [{ id: "v_1", name: "Family car", seats: 5 }],
    standing,
    policies: suggestPolicies(d),
    values: d.values,
    preferences: { giftIdeas: ["LEGO", "books", "art supplies"], brands: [], shops: [] },
  };
}

export function suggestPolicies(d: HouseholdDraft): Policy[] {
  const pol: Policy[] = [
    { id: "pol_autopay", kind: "auto_pay_cap", title: "Pay school, club and clinic fees under $50 without asking", description: "Verified payees only. Everything above the cap waits for a tap.", params: { maxAmount: 50 }, enabled: true },
    { id: "pol_radius", kind: "transit_radius", title: "Keep weekend activities within 30 minutes", description: "Recurring weekend programs further than that get flagged.", params: { maxMinutes: 30, appliesTo: "recurring" }, enabled: true },
    { id: "pol_max", kind: "max_activities", title: "At most two structured activities per child per season", description: "Protects unstructured time.", params: { max: 2 }, enabled: true },
    { id: "pol_budget", kind: "budget", title: "Activities budget $600 a month", description: "Registrations, fees and gear across the household.", params: { monthly: 600 }, enabled: true },
    { id: "pol_gift", kind: "gift_cap", title: "Birthday gifts up to $30", description: "The default for kids' parties.", params: { maxAmount: 30 }, enabled: true },
    { id: "pol_sunday", kind: "quiet_block", title: "Sunday mornings unplugged", description: "Keep Sunday before noon free where possible.", params: { day: 0, until: "12:00" }, enabled: false },
  ];
  const young = d.children.find((c) => (c.age ?? 99) <= 5);
  if (young) pol.push({ id: "pol_evening", kind: "evening_cutoff", title: `${young.name} home by 6:30pm on school nights`, description: "No commitments for under-6s that end after 6:30pm Sunday to Thursday.", params: { maxAge: 5, cutoff: "18:30" }, enabled: true });
  for (const c of d.children) {
    if (c.allergies?.length) pol.push({ id: `pol_allergy_${slug(c.name)}`, kind: "allergen", title: `${c.name}'s ${c.allergies.join(" and ")} allergy is always stated`, description: "Any RSVP or note where food is involved must mention it. The guardian blocks messages that do not.", params: { childId: `c_${slug(c.name)}`, allergens: c.allergies }, enabled: true });
  }
  const cop = d.adults.find((a) => a.role === "coparent");
  if (cop) pol.push({ id: "pol_custody", kind: "custody", title: `Handover changes with ${cop.name} go through the ledger`, description: "Requests are reduced to facts; replies are drafted, never auto-sent; both sides see the record.", params: { childId: d.children[0] ? `c_${slug(d.children[0].name)}` : "", coparentId: `p_${slug(cop.name)}`, handoverDay: 5, handoverTime: "18:00", nextHandover: "" }, enabled: true });
  if (d.values.some((v) => /creativ|art|music/i.test(v))) pol.push({ id: "pol_creative", kind: "one_per_category", title: "One creative program per child per term", description: "Because you said creativity matters.", params: { category: "creative", min: 1 }, enabled: true });
  return pol;
}

function workBlocks(pattern?: string): Person["unavailable"] {
  if (!pattern) return undefined;
  const p = pattern.toLowerCase();
  const days = /mon|tue|wed|thu|fri/.test(p) ? [1, 2, 3, 4, 5].filter((d) => new RegExp(DAYS[d].slice(0, 3)).test(p)) : /full[- ]?time|9 ?(to|-) ?5|office/.test(p) ? [1, 2, 3, 4, 5] : /part[- ]?time|three days/.test(p) ? [1, 2, 3] : [];
  const wfh = /from home|wfh|remote/.test(p);
  return days.map((d) => ({ day: d, start: "09:00", end: wfh ? "15:00" : "17:30", label: wfh ? "Work (from home)" : "Work", flexible: wfh }));
}

function addHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export const SAMPLE_INTRO = `Hi, I'm Priya and my partner is Tom. We live in Leichhardt in Sydney. Three kids: Ava is 11 and in Year 6 at Leichhardt Public School, she does piano on Fridays at 4:30 in Petersham and netball training Wednesdays. Leo is 8, Year 3 at the same school, football on Saturday mornings at 9 at Jubilee Oval and art club Thursdays after school; Leo is allergic to nuts. Maya is 4 at Little Wonders Preschool in Lilyfield and has swimming Saturdays at 10:30 at Ashfield pool. Ava's dad Daniel lives in Marrickville and has her every second weekend from Friday 6pm. I work from home Wednesdays and Fridays, in the office the other days; Tom works full time. We care about the kids being resilient, creative, and having proper unstructured time outdoors. Keep things calm with Daniel.`;

export { newId };
