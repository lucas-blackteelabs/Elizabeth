# Family OS Service

Backend of Family OS, an agentic operating system for the household. Same stack and layout as `bondai-service`.

| Component | Technology |
|---|---|
| Framework | Spring Boot 3.3.4 |
| Language | Java 21 |
| Database | MongoDB |
| AI | Spring AI 1.0 (Gemini via OpenAI-compatible endpoint; swap to OpenAI by config) |
| Auth | JWT access + rotating refresh tokens |
| Build | Gradle 8.10 |
| Container | Docker (Jib), Elastic Beanstalk `.platform` |

## Quick start

```bash
# MongoDB running locally, then:
export GOOGLE_API_KEY=your-gemini-key      # optional; rules-based reading without it
./gradlew bootRun --args='--spring.profiles.active=local --server.port=8080'
```

API at `http://localhost:8080/api`, Swagger at `http://localhost:8080/api/swagger-ui/index.html`.

```bash
./gradlew test              # 18 tests, no Mongo needed
./gradlew jibDockerBuild    # image: family-os-service
./gradlew zip               # build/family-os-service.zip for Elastic Beanstalk
```

## First run, end to end

1. `POST /api/v1/auth/signup` `{name, username(email), password}` → `{accessToken, refreshToken}`
2. `POST /api/v1/households/demo` → seeds the demo family and runs its eight-message inbox
3. `GET /api/v1/brief` → tonight's brief
4. `POST /api/v1/ledger/{id}/decision` `{kind: "APPROVE"}`

Or onboard a real family: `POST /v1/households/onboarding/draft {text}` → review → `POST /v1/households/onboarding/commit {draft, disabledPolicies, trustPreset}` → `POST /v1/inbox {channel, from, subject, body}`.

## Endpoints

| Area | Endpoints |
|---|---|
| Auth | `POST /v1/auth/signup`, `/login`, `/refresh`, `/signout` |
| Households | `GET /v1/households/me`, `POST /onboarding/draft`, `GET /onboarding/sample`, `POST /onboarding/commit`, `POST /demo`, `PUT /me/policies/{id}`, `PUT /me/trust` |
| Inbox | `POST /v1/inbox`, `GET /v1/inbox/signals`, `GET /v1/inbox/samples` |
| Brief | `GET /v1/brief`, `GET /v1/brief/script` |
| Ledger | `GET /v1/ledger`, `POST /v1/ledger/{id}/decision`, `GET /proposals`, `GET /trace`, `GET /messages`, `GET /spend` |
| Calendar | `GET /v1/calendar?from&to`, `GET /reminders`, `POST /ics` |
| Chores | `GET /v1/chores`, `POST /{id}/complete`, `/undo`, `POST /v1/chores`, `DELETE /{id}`, `POST /claims`, `POST /claims/{id}/approve`, `POST /rewards` |

## Configuration

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Gemini key (default model `gemini-2.5-flash`) |
| `AI_BASE_URL`, `AI_COMPLETIONS_PATH`, `AI_MODEL`, `OPENAI_API_KEY` | Override to run on OpenAI |
| `JWT_SECRET` | HMAC secret for access tokens |
| `PORT` | Defaults to 5000 (Elastic Beanstalk nginx upstream) |
| `BASE_URL` | Public base URL |

See `CLAUDE.md` for the architecture and `docs/` for the design.
