export const appRoutes = {
  auth: { base: '/(auth)/auth' },
  tonight: '/(protected)/(tabs)/tonight',
  week: '/(protected)/(tabs)/week',
  kids: '/(protected)/(tabs)/kids',
  send: '/(protected)/(tabs)/send',
  settings: '/(protected)/settings',
  onboarding: '/(protected)/onboarding',
} as const;
