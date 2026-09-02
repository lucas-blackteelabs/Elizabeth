import { Redirect } from 'expo-router';
import { useAuthContext } from '@/context/AuthContext';
import { appRoutes } from '@/config/appRoutes';

export default function IndexPage() {
  const { isAuthenticated, isLoading } = useAuthContext();
  if (isLoading) return null;
  return <Redirect href={isAuthenticated ? appRoutes.tonight : appRoutes.auth.base} />;
}
