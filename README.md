# Family OS Portal

Web app and always-on wall display for Family OS. Same stack and layout as `bondai-portal-deploy`: Next.js 16 (app router), React 19, Tailwind 4, Radix primitives, TanStack Query, Phosphor icons, Axios.

## Run

```bash
npm install
cp .env.example .env     # NEXT_PUBLIC_API_URL=/api, FAMILY_OS_API_ORIGIN=http://localhost:8080/api
npm run dev              # http://localhost:3000
```

The browser calls `/api/*` on this origin; `next.config.ts` proxies to the service (`FAMILY_OS_API_ORIGIN`), so no CORS setup is needed. Point `FAMILY_OS_API_ORIGIN` at the deployed service in production.

## Routes

| Route | What |
|---|---|
| `/login`, `/signup` | Auth (JWT + refresh, same contract as BondAI) |
| `/welcome` | Onboarding: describe the family, review, house rules, trust preset |
| `/tonight` | The Evening Brief: decide, handled, later, good to know. Listen button reads the script aloud |
| `/week` | Next two weeks, who's driving, reminders |
| `/kids` | Chores, points, streaks, rewards |
| `/send` | Paste anything; connect calendar links |
| `/settings` | Trust ladder, house rules, demo, sign out |
| `/wall` | Always-on display for a tablet or TV |

## Structure

```
app/
├── (auth)/ (protected)/ (wall)/   route groups
├── components/ui | layout | brief | kids | providers
├── config/        apiEndpoints, appRoutes, queryKeys
├── contexts/      AuthContext
├── hooks/         *.hooks.ts (TanStack Query over services)
├── lib/           types, utils (auth storage, jwt, time, cn), constants
└── services/      apiClient (axios + refresh), generic.service, *.service.ts
```
