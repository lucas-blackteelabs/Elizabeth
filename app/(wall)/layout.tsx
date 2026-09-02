'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { appRoutes } from '@/config/appRoutes';
import { useAuth } from '@/contexts/AuthContext';

export default function WallLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  useEffect(() => { if (isReady && !isAuthenticated) router.replace(appRoutes.auth.login); }, [isReady, isAuthenticated, router]);
  if (!isReady || !isAuthenticated) return null;
  return <div className="dark min-h-screen bg-[#0B1016] text-[#EEF2F6]">{children}</div>;
}
