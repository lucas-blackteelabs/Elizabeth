'use client';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/config/appRoutes';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpPage() {
  const { signUp, isPending } = useAuth();
  const { register, handleSubmit } = useForm<{ name: string; username: string; password: string }>();
  return (
    <form onSubmit={handleSubmit((v) => signUp(v))} className="grid gap-3">
      <h1 className="mb-1 text-4xl font-bold leading-tight">Let&apos;s run the house.</h1>
      <p className="mb-3 text-muted">One account per household. Your partner can share it.</p>
      <Input placeholder="Your first name" autoComplete="given-name" {...register('name', { required: true })} />
      <Input placeholder="Email" type="email" autoComplete="email" {...register('username', { required: true })} />
      <Input placeholder="Password (8+ characters)" type="password" autoComplete="new-password" {...register('password', { required: true, minLength: 8 })} />
      <Button variant="primary" size="lg" type="submit" disabled={isPending}>Create account</Button>
      <p className="text-center text-sm text-muted">Already set up? <Link className="underline" href={appRoutes.auth.login}>Sign in</Link></p>
    </form>
  );
}
