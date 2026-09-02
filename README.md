# Family OS App

React Native app for Family OS, built with **Expo SDK 54** and **Expo Router**, the same setup as `bondai-app`.

## Run

```bash
npm install
cp .env.example .env            # EXPO_PUBLIC_BASE_URL=http://localhost:8080 (the service)
npx expo start                  # Expo Go / simulator
npx expo run:ios                # native build (needs Xcode + CocoaPods)
npm run typecheck
```

EAS profiles (`eas.json`) set `EXPO_PUBLIC_BASE_URL` per environment, as in bondai-app.

## Structure

```
app/
├── _layout.tsx                 providers: SafeArea, GestureHandler, PersistQueryClient, Auth, Paper, Theme
├── index.tsx                   redirect by auth state
├── (auth)/auth                 sign in / create account
└── (protected)/
    ├── (tabs)/tonight | week | kids | send
    ├── settings
    └── onboarding
config/      apiEndpoints, appRoutes, queryClient (AsyncStorage persister), queryKeys
services/    apiClient (axios + SecureStore tokens + refresh), *Service.ts
hooks/       use*.ts (TanStack Query)
context/     AuthContext
theme/       theme tokens + ThemeContext
components/  common (Screen, Card, Button), brief (BriefCard)
types/       API types shared in shape with the portal
```

Icons: `phosphor-react-native`. State: TanStack Query with the AsyncStorage persister. Speech: `expo-speech` reads tonight's brief.
