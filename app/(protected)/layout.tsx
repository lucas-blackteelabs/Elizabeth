'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { appRoutes } from '@/config/appRoutes';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/household.hooks';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { error, isLoading } = useHousehold(isReady && isAuthenticated);
  const onWelcome = pathname.startsWith(appRoutes.welcome);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) router.replace(appRoutes.auth.login);
    else if (error?.response?.status === 404 && !onWelcome) router.replace(appRoutes.welcome);
  }, [isReady, isAuthenticated, error, onWelcome, router]);

  if (!isReady || !isAuthenticated) return null;
  if (onWelcome) return <>{children}</>;
  if (isLoading || error) return null;
  return <AppShell>{children}</AppShell>;
}
