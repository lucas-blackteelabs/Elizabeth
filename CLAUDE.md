# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family OS Service is a Spring Boot 3.3.4 / Java 21 application: the backend of an agentic household operating system. Any message a family receives (school email, coach WhatsApp, clinic SMS, co-parent text) is read into a typed signal, placed on the household calendar, checked against the family's own rules, and either executed within the trust the agents have earned or reduced to a one-tap decision in the Evening Brief.

It mirrors bondai-service's conventions: DDD layered packages, Spring Data MongoDB, Spring AI with markdown prompts and structured output, JWT auth, springdoc OpenAPI, Jib images, Elastic Beanstalk `.platform`.

## Build and Development Commands

- `./gradlew build` - build and test
- `./gradlew test` - JUnit 5 tests (pure unit tests with Mockito, no Mongo needed)
- `./gradlew bootRun --args='--spring.profiles.active=local'` - run locally (needs MongoDB)
- `./gradlew jibDockerBuild` - Docker image `family-os-service` on `amazoncorretto:21-alpine`
- `./gradlew zip` - `build/family-os-service.zip` for Elastic Beanstalk (jar + `.platform`)

Context path is `/api`; the server listens on `PORT` (default 5000, the EB nginx upstream). Swagger UI at `/api/swagger-ui/index.html`.

## Architecture

```
api/            controllers (v1), security filters, OpenAPI, exception handler
application/    services, the agent pipeline, Spring AI agents, DTOs, events
domain/         MongoDB documents and repositories
infrastructure/ ChatClient config, iCal parser, prompt file reader, time helpers
```

### The pipeline (`application/pipeline`)

`OrchestratorService.ingest` runs, for one `RawMessage`:
intake (`IntakeRules`, refined by `IntakeExtractor` when a model key is set) → `Triage` → `SchedulerAgent` → `LogisticsAgent` → `ProcurementAgent` → `DevelopmentAgent` → `CommsAgent` → `GuardianAgent` (checks, can block) → `TrustPolicy.dispose` per action (execute / stage / suggest / observe) → `Executor` → `LedgerEntry` → `ChoreProposer`.

Agents are pure functions over a `PipelineContext`; the orchestrator loads the context from repositories and persists what changed. This is what makes them unit-testable without Mongo (see `PipelineTest`).

### AI agents (`application/agents`)

Spring AI `ChatClient` with `.entity(Class)` structured output and prompts in `src/main/resources/prompts/*.md`, exactly as bondai-service does. The model is reached through the OpenAI starter; by default `base-url` points at Google's OpenAI-compatible endpoint so `GOOGLE_API_KEY` + `gemini-2.5-flash` works. Set `AI_BASE_URL=https://api.openai.com`, `AI_COMPLETIONS_PATH=/v1/chat/completions`, `AI_MODEL=gpt-4.1-mini`, `OPENAI_API_KEY=...` to run on OpenAI. `AiAvailability.ready()` gates every agent so the service works with no key at all.

### Trust ladder

`TrustSetting` per `ActionClass`, levels 0–4. `TrustPolicy.dispose` decides; approvals climb, declines step down; payments have a verified-payee cap; signing forms is pinned.

## Environment Variables

- `MONGODB_URI` (default `mongodb://localhost:27017/familyos`)
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` (or `OPENAI_API_KEY` with the AI_* overrides)
- `JWT_SECRET`
- `PORT`, `BASE_URL`

## Conventions

- Controllers are thin; they resolve the household with `HouseholdService.requireForUser(userService.getAuthenticatedUserId())` and delegate.
- Request/response types are records nested in the controller or small DTO classes.
- Domain events (`SignalIngestedEvent`, `DecisionMadeEvent`) are published for handlers such as push notifications.
- Never add logic to a controller that belongs in a pipeline agent, and never let an agent touch a repository.
