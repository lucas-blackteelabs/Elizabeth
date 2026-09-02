# CLAUDE.md

Next.js 16 app-router portal for Family OS, structured like bondai-portal-deploy.

- `npm run dev` / `npm run build` / `npm run lint`
- API calls go through `services/apiClient.ts` (axios, bearer token, refresh-and-retry on 401). Add endpoints in `config/apiEndpoints.ts`, a service in `services/`, a hook in `hooks/` built on `useGenericGet` / `useGenericMutate`, and only then use it in a page.
- Icons: Phosphor only. Styling: Tailwind 4 with the tokens declared in `app/globals.css` `@theme` (colors: ground, surface, soft, ink, muted, line, accent, need, done, later, danger).
- Copy is first person and plain ("I've paid the $38. I just need your signature."). No CRM vocabulary.
- `(protected)/layout.tsx` guards auth and redirects to `/welcome` when the service returns 404 for the household.
