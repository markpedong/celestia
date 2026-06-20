'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AuthMethodsProps } from '@/lib/types';
import { Apple, Globe, KeyRound, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Provider } from '@supabase/supabase-js';

const supabase = createSupabaseBrowserClient();

const AuthMethods: FC<AuthMethodsProps> = ({ mode }: AuthMethodsProps) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === 'sign-up';

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = isSignUp
        ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() || email.split('@')[0] },
            emailRedirectTo: `${window.location.origin}/auth/sign-in`,
          },
        })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (isSignUp && !result.data.session) {
        setMessage('Check your inbox to confirm your account, then sign in.');
        return;
      }

      router.replace('/');
      router.refresh();
    });
  };

  const continueWithProvider = (provider: Extract<Provider, 'google' | 'apple'>) => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) setError(oauthError.message);
    });
  };

  return (
    <div className='space-y-4'>
      <div className='grid gap-2 sm:grid-cols-2'>
        <button type='button' onClick={() => continueWithProvider('google')} disabled={pending} className='flex h-11 items-center justify-center gap-2 rounded border border-border bg-background text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-60'>
          <Globe className='size-4' />
          Google
        </button>
        <button type='button' onClick={() => continueWithProvider('apple')} disabled={pending} className='flex h-11 items-center justify-center gap-2 rounded border border-border bg-background text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-60'>
          <Apple className='size-4' />
          Apple
        </button>
      </div>
      <div className='flex items-center gap-3'>
        <span className='h-px flex-1 bg-border' />
        <span className='text-xs font-medium text-muted-foreground'>or continue with email</span>
        <span className='h-px flex-1 bg-border' />
      </div>
      <form onSubmit={submit} className='space-y-4'>
        {isSignUp ? (
        <div className='space-y-2'>
          <label htmlFor='name' className='text-sm font-medium text-card-foreground'>Display name</label>
          <Input id='name' value={name} onChange={(event) => setName(event.target.value)} placeholder='Your name' className='h-11 bg-background' />
        </div>
        ) : null}
        <div className='space-y-2'>
        <label htmlFor='email' className='text-sm font-medium text-card-foreground'>Email</label>
        <Input id='email' type='email' value={email} onChange={(event) => setEmail(event.target.value)} placeholder='you@example.com' required className='h-11 bg-background' />
        </div>
        <div className='space-y-2'>
        <label htmlFor='password' className='text-sm font-medium text-card-foreground'>Password</label>
        <Input id='password' type='password' minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder='At least 6 characters' required className='h-11 bg-background' />
        </div>
        <Button type='submit' disabled={pending} className='celestia-primary-action h-11 w-full rounded'>
          {isSignUp ? <Mail className='size-4' /> : <KeyRound className='size-4' />}
          {pending ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </Button>
      </form>
      {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
      {error ? <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>{error}</p> : null}
    </div>
  );
};

export default AuthMethods;
