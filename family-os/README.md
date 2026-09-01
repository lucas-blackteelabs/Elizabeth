# Family OS — an agentic operating system for the household

*Prototype and design thesis. Working name; the product name is not decided.*

Parents are not short of apps. They are short of an executor. Every school email, coach WhatsApp, clinic SMS, uniform notice and co-parent text is a small job that lands on one adult's head and stays there until they type it into something. The trackers, shared calendars and forums all ask that adult to do the typing. That is the failure mode. This prototype is built on the opposite premise: **user input is a bug**. Anything that arrives by any channel is read, placed, checked against the family's own rules, and either done or reduced to one tap.

This directory is a runnable, zero-dependency implementation of the core loop, plus the thinking behind it.

```
cd family-os
npm run demo          # one Tuesday evening, eight inputs, printed as the Evening Brief
npm run demo -- --trace   # same, with every agent step
npm run dev           # command center on http://localhost:5100
npm test              # 23 tests, node's built-in runner
npm run check         # typecheck
```

Requires Node 22.18 or later (TypeScript runs natively, no build). No runtime dependencies. No API key is needed: the intake parser is rule-based and inspectable. Set `ANTHROPIC_API_KEY` or `GOOGLE_API_KEY` and the intake agent additionally uses a model for messy inputs, with the rules parser as the floor.

---

## 1. The thesis, iterated

The brief this started from identified the gap correctly: no product joins **administrative logistics**, **household operations** and **child development** into one autonomous layer. Four things were added or changed on the way to a design that could plausibly become the default infrastructure for running a home.

**The moat is not the email parser.** Parsing will commoditise within a year; every model can read a school newsletter. The durable assets are three data structures nobody else holds:

| Asset | What it is | Why it compounds |
|---|---|---|
| **Household graph** | People, roles, custody, schools, places with travel times, vehicles, sizes, allergies, interests, adult availability, standing commitments | Learned from the digital footprint, confirmed once, kept current by the agents. Every new signal makes it richer. |
| **Commitment ledger** | Every obligation the family has to the outside world, as a state machine with an append-only history of who did what | The single source of truth for both parents and, per child, the co-parent. Court-grade if it has to be. |
| **Trust ladder** | Per action class, how much autonomy the agents have earned, with the approval and override history | The thing that makes a family comfortable letting software pay a fee or send a message. Non-transferable. |

**Autonomy has to be earned, not toggled.** Every "AI assistant" fails at the same point: the parent will not let it act. The ladder has five rungs per action class (observe, suggest, prepare, execute and notify, autonomous). Reversible, low-stakes classes start high. Anything touching money, a signature, or another human starts at "prepare" or below. Three consecutive approvals earn an offer to move up; one decline moves down. Payments carry conditions (a verified payee, an amount under a cap the parents set). Signing forms is pinned. This is what turns a demo into a product people keep.

**One brief a day.** The interface question (invisible text-and-email versus app-first command center) is a false choice. Ingestion is invisible: forward, CC, screenshot, voice. Decisions arrive once a day as the Evening Brief, compressed to the handful of taps only a parent can make. The command center exists for the rare deep look: the calendar, the ledger, the policies, the trust settings, and "why did it do that?" for every action. The metric the whole system optimises is **decision compression**: signals in versus decisions out. Tonight's demo turns eight inputs into four taps.

**A guardian that never proposes.** Specialist agents are optimistic by design. A separate check runs every combined proposal against household policy and budget, blocks anything a parent would be upset to discover was done without them, and forces the allergy into any RSVP where food is involved. Separating proposing from checking is what keeps the trust ladder honest.

### The billion-dollar shape

The platform earns three ways, in the order they become available:

1. **Subscription** for the household, priced against the hours it gives back.
2. **Transaction rake** on what it already handles: activity enrolments, camp bookings, uniform and gear orders, party gifts. The procurement agent is a high-intent purchasing channel with the sizes, dates and budget already known.
3. **The institution side of the network.** Once enough households run on the ledger, schools, clubs and clinics stop sending PDFs and publish structured notices straight into the graph, because it cuts their unpaid-fee and unsigned-form chasing to zero. That is the point where switching cost becomes prohibitive and the product becomes the protocol between institutions and families.

The wedge is the most-hated single job in family life: school communications. Forward the school's emails, get a brief. Everything else attaches to that habit.

---

## 2. Architecture

```
  email · WhatsApp · SMS · portal · PDF · voice
                    │
                    ▼
            ┌──────────────┐        household graph ─┐
            │   intake      │  raw → Signal            │
            └──────┬───────┘                          │
                   ▼                                  │
            ┌──────────────┐                          │
            │   triage      │  urgency, due-by        │
            └──────┬───────┘                          │
     ┌─────────────┼──────────────┬───────────────┐   │
     ▼             ▼              ▼               ▼   ▼
 scheduler     logistics     procurement     development   comms
 place it,     who drives,   fees, gifts,    fit with       RSVPs, replies,
 find clashes  what shuffles gear, packing   values & load  neutral co-parent
     └─────────────┴──────────────┴───────────────┴───────┘
                   ▼
            ┌──────────────┐
            │   guardian    │  policy & budget checks; can block
            └──────┬───────┘
                   ▼
            ┌──────────────┐
            │  trust ladder │  per action: execute · stage · suggest · observe
            └──────┬───────┘
                   ▼
        execute ──► calendar, reminders, spend, drafts, standing commitments
                   ▼
            ┌──────────────┐
            │    ledger     │  detected → awaiting_decision | executed | scheduled | noted
            └──────┬───────┘
                   ▼
              Evening Brief   (decide · done · later · fyi)  +  full agent trace
```

`src/core` holds the data structures (types, time, calendar, policy, trust, ledger, state). `src/agents` holds one file per agent plus the brief composer. `src/orchestrator.ts` runs the loop and applies parent decisions. `src/server.ts` is a dependency-free HTTP server for the command center in `web/`. `src/demo` is the seeded household and inbox.

### Household policy engine

Policies are declarative and parents own them. The seeded family has ten, including a 30-minute weekend transit radius for recurring programs, a 6:30pm school-night cutoff for under-6s, a nut allergy that must be stated wherever food is involved, at most two structured activities per child per season, at least one creative program per term, a monthly activities budget, an auto-pay cap for verified payees, a gift cap, Sunday mornings unplugged, and the custody pattern for the eldest child. Toggling a policy in the command center changes the agents' decisions on the next inbox run.

### Co-parent channel

Messages from the co-parent are never shown raw. The tone is scored, hostile phrasing is stripped, and only the logistics facts reach the parent. The scheduler checks the request against the child's calendar and finds the earliest realistic alternative; the comms agent drafts a neutral reply proposing it, with alternatives (accept, hold the usual time). Replies to a co-parent start at "suggest" and are never auto-sent. Everything lands in the ledger both parents can see for that child.

---

## 3. What the demo shows

Tuesday 1 September 2026, 6:30pm, Inner West Sydney. Two parents, three children, one co-parent residence. Eight inputs arrived across email, WhatsApp and SMS. Nobody typed anything in.

| Input | What the agents did | Left for a parent |
|---|---|---|
| School email: Year 6 zoo excursion, $38, permission by Friday | Mapped Year 6 to Ava, added it to the calendar, paid the $38 (verified payee, under the cap), set a nut-free packed-lunch reminder | **Sign** the permission note (pinned to always ask) |
| Coach WhatsApp: Saturday game moved 9am to 10:30am | Matched to Leo's standing football, moved it, detected that Priya was now double-booked driving Maya to swimming, reassigned Tom (his gym block is flexible), offered the mirror-image swap | Nothing. Handled end to end. |
| Party invitation, 45 minutes away, pizza provided | Added it, assigned Priya to drive, reminder for grip socks, chose a LEGO gift under the $30 cap, drafted an RSVP that states Leo's nut allergy, noted the one-off travel outside the weekend radius | **Send** the RSVP and approve the gift |
| Paediatrician SMS with "reply Y to confirm" | Added a 45-minute appointment, found Priya free after her flexible work-from-home block, reminder for the Blue Book and Medicare card | **Send** the "Y" |
| Uniform shop: summer orders close 25 September | Projected both children one size up from February's records, priced the order, set a reminder two days before the cut-off | Parked for later: **Order** |
| Hostile text from the co-parent demanding a 5pm handover | Reduced it to three neutral facts, found Ava's piano runs to 5:15pm, drafted a reply proposing 5:30pm plus two alternatives, set a reminder to pack the homework folder | **Send** (never auto-sent) |
| Cricket registration, ages 5 to 8, $180 | Matched Leo's interest and age, checked the two-activity cap for the summer season, confirmed the first session and the drive are clear, checked October's budget | Parked for later: **Enrol** |
| School newsletter | Filed as FYI with the optional P&C meeting noted | Nothing |

Approve the RSVP in the command center and the ledger records it, the message is sent, and the outbound-message class gains an approval toward promotion. Decline something and the class steps down a rung.

---

## 4. Where this goes next

The prototype deliberately keeps the intelligence legible. The production path:

- **Ingestion at the system level.** Mail and calendar OAuth, a forwarding address and a CC alias per household, WhatsApp and SMS via a business number, photo and PDF via vision, voice notes. Each becomes a `RawMessage`; nothing downstream changes.
- **A model in the intake agent, with the rules parser as the floor.** The adapter is already there. The right architecture is extraction into the same `Extracted` schema, with confidence gating: anything under threshold is shown to the parent as a question in the brief rather than acted on.
- **Real execution adapters.** Calendar write-back to both parents' phones, payment rails for verified payees (school portals, club registration systems), messaging send, commerce for the procurement agent. Every adapter sits behind the same trust disposition, so the ladder governs real money and real messages exactly as it governs the demo.
- **Multi-household.** The co-parent gets their own graph and their own brief, sharing only the child's ledger. Handover changes need both sides' approval and the ledger holds both signatures.
- **The institution API.** A structured-notice schema schools and clubs can publish to directly, with signature, payment and RSVP as first-class fields. This is the network effect.
- **Development layer.** The seeded values ("resilience", "creativity", "unstructured outdoor time") already shape enrolment suggestions and Sunday mornings. The next step is carrying milestones, term reports and the parents' intentions into a per-child view that recommends, rather than a tracker that demands entry.

What was left out on purpose: authentication, persistence (state is in memory and resets with the process), real integrations, and a mobile shell. All of those are known engineering; the part worth prototyping was the loop from raw message to earned autonomy.
