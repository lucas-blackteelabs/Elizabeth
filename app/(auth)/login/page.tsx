'use client';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/config/appRoutes';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, isPending } = useAuth();
  const { register, handleSubmit } = useForm<{ username: string; password: string }>();
  return (
    <form onSubmit={handleSubmit((v) => login(v))} className="grid gap-3">
      <h1 className="mb-1 text-4xl font-bold leading-tight">Welcome back.</h1>
      <p className="mb-3 text-muted">Sign in to see tonight&apos;s brief.</p>
      <Input placeholder="Email" type="email" autoComplete="email" {...register('username', { required: true })} />
      <Input placeholder="Password" type="password" autoComplete="current-password" {...register('password', { required: true })} />
      <Button variant="primary" size="lg" type="submit" disabled={isPending}>Sign in</Button>
      <p className="text-center text-sm text-muted">New here? <Link className="underline" href={appRoutes.auth.signup}>Create an account</Link></p>
    </form>
  );
}
