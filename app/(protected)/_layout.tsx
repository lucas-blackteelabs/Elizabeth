import { useEffect } from 'react';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { appRoutes } from '@/config/appRoutes';
import { useAuthContext } from '@/context/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const { error, isLoading: loadingHousehold } = useHousehold(isAuthenticated);
  const router = useRouter();
  const segments = useSegments();
  const onOnboarding = segments.includes('onboarding' as never);
  useEffect(() => {
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    if (status === 404 && !onOnboarding) router.replace(appRoutes.onboarding);
  }, [error, onOnboarding, router]);
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href={appRoutes.auth.base} />;
  if (loadingHousehold && !onOnboarding) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="onboarding/index" />
    </Stack>
  );
}
