# Architecture

Family OS Service follows the same Domain-Driven, layered structure as bondai-service.

```
┌───────────────────────────────────────────────┐
│ API: controllers, JWT filters, OpenAPI        │
├───────────────────────────────────────────────┤
│ Application: services, pipeline, agents, DTOs │
├───────────────────────────────────────────────┤
│ Domain: documents, repositories, enums        │
├───────────────────────────────────────────────┤
│ Infrastructure: Spring AI, iCal, prompts, time│
└───────────────────────────────────────────────┘
```

## Collections

| Collection | Document | Purpose |
|---|---|---|
| `users` | `User` | Login identity, owns one household |
| `refresh_tokens` | `RefreshToken` | Rotating refresh tokens |
| `households` | `Household` | The household graph: people, places, standing commitments, policies, trust, feeds |
| `signals` | `Signal` | Every input, with what was extracted |
| `proposals` | `Proposal` | What the agents proposed for a signal: actions, alternatives, flags, rationale |
| `ledger_entries` | `LedgerEntry` | The commitment ledger: state machine + append-only history |
| `calendar_events` | `CalendarEvent` | Standing occurrences, signal events, iCal imports |
| `reminders` | `Reminder` | Reminders the agents set |
| `outbound_messages` | `OutboundMessage` | Sent RSVPs and replies |
| `spend_entries` | `SpendEntry` | Committed spend per month, for the budget policy |
| `chore_boards` | `ChoreBoard` | Chores, points, rewards, claims |
| `trace_steps` | `TraceStep` | Every step every agent took |

## The loop

```
RawMessage ─► IntakeRules (+IntakeExtractor) ─► Signal
         ─► Triage ─► urgency, due-by
         ─► Scheduler ┐
            Logistics │
            Procurement ├─► AgentOutput (actions, alternatives, flags, rationale)
            Development│
            Comms     ┘
         ─► Guardian (budget, allergen wording, unverified payees; can BLOCK)
         ─► TrustPolicy.dispose per action ─► Executor for EXECUTED
         ─► LedgerEntry (awaiting_decision | executed | scheduled | noted)
         ─► ChoreProposer
```

`PipelineContext` carries the household, the frozen "now", the calendar horizon, the chore board and committed spend into the agents, and carries new events, reminders, messages, spend and trace steps back out. The orchestrator persists the delta.

## Decisions

`OrchestratorService.decide` approves (executes pending or a chosen alternative, records approvals; three in a row offers a promotion), declines (records an override and steps the ladder down) or snoozes.
