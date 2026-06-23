'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { KeyRound, LoaderCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, PasswordField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/constants';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type PasswordRecoveryFormProps = { mode: 'request' | 'update' };

export const PasswordRecoveryForm = ({ mode }: PasswordRecoveryFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === 'request' && !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (mode === 'update' && (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH)) {
      setError(`Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (mode === 'update' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const result = mode === 'request'
        ? await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
        })
        : await supabase.auth.updateUser({ password });

      if (result.error) {
        setError(mode === 'request' ? 'We could not send a reset email. Please try again.' : 'We could not update your password. Request a new reset link and try again.');
        return;
      }

      if (mode === 'request') setMessage('If an account exists for that email, a reset link is on its way.');
      else window.location.assign('/');
    });
  };

  const isRequest = mode === 'request';
  return (
    <form onSubmit={submit} className='space-y-4' noValidate>
      {isRequest ? (
        <FormField htmlFor='email' label='Email' labelClassName='text-card-foreground' error={error ?? undefined}>
          <Input id='email' type='email' autoComplete='email' value={email} onChange={event => setEmail(event.target.value)} maxLength={MAX_EMAIL_LENGTH} placeholder='you@example.com' className='h-11 bg-background' />
        </FormField>
      ) : (
        <>
          <PasswordField id='password' label='New password' labelClassName='text-card-foreground' autoComplete='new-password' value={password} onChange={event => setPassword(event.target.value)} placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} className='h-11 bg-background' />
          <PasswordField id='confirm-password' label='Confirm new password' labelClassName='text-card-foreground' autoComplete='new-password' value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder='Re-enter your password' className='h-11 bg-background' error={error ?? undefined} />
        </>
      )}
      <Button type='submit' disabled={pending} className='celestia-primary-action h-11 w-full rounded'>
        {pending ? <LoaderCircle className='size-4 animate-spin' /> : isRequest ? <Mail className='size-4' /> : <KeyRound className='size-4' />}
        {pending ? 'Please wait...' : isRequest ? 'Send reset link' : 'Update password'}
      </Button>
      <Button asChild variant='link' size='sm' className='w-full'>
        <Link href='/auth/sign-in'>Back to sign in</Link>
      </Button>
      {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
    </form>
  );
};
