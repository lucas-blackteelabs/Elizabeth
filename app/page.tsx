'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { appRoutes } from '@/config/appRoutes';

export default function Home() {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isReady) return;
    router.replace(isAuthenticated ? appRoutes.tonight : appRoutes.auth.login);
  }, [isAuthenticated, isReady, router]);
  return null;
}
