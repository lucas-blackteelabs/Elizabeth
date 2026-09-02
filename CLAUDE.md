# CLAUDE.md

Expo SDK 54 + Expo Router app for Family OS, mirroring bondai-app.

- `npx expo start`, `npm run typecheck`, `npm run lint`
- Screens live under `app/` (file-based routes). Data flows: `config/apiEndpoints.ts` → `services/*Service.ts` → `hooks/use*.ts` → screen.
- `services/apiClient.ts` attaches the bearer token from SecureStore and refreshes on 401; do not call axios directly from screens.
- Theme tokens come from `theme/theme.ts` via `useTheme()`; Phosphor icons only.
- Copy is first person and plain, same voice as the portal and the service's brief.
