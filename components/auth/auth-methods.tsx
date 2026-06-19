'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { KeyRound, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type Props = {
  mode: 'sign-in' | 'sign-up';
};

const supabase = createSupabaseBrowserClient();

const AuthMethods = ({ mode }: Props) => {
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

  return (
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
      <Button type='submit' disabled={pending} className='celestia-primary-action h-11 w-full rounded-xl'>
        {isSignUp ? <Mail className='size-4' /> : <KeyRound className='size-4' />}
        {pending ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
      </Button>
      {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
      {error ? <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>{error}</p> : null}
    </form>
  );
};

export default AuthMethods;
