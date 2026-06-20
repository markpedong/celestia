'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthForm } from '@/hooks/use-auth-form';
import type { AuthMethodsProps } from '@/lib/types';
import { Apple, Globe, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';

const AuthMethods: FC<AuthMethodsProps> = ({ mode }: AuthMethodsProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    continueWithProvider,
    error,
    isSignUp,
    message,
    pending,
    submit,
  } = useAuthForm(mode);

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
      <form onSubmit={handleSubmit(submit)} className='space-y-4' noValidate>
        {isSignUp ? (
        <div className='space-y-2'>
          <label htmlFor='name' className='text-sm font-medium text-card-foreground'>Display name</label>
          <Input id='name' placeholder='Your name' maxLength={60} aria-invalid={Boolean(errors.name)} className='h-11 bg-background' {...register('name')} />
          {errors.name ? <p className='text-xs text-destructive'>{errors.name.message}</p> : null}
        </div>
        ) : null}
        <div className='space-y-2'>
        <label htmlFor='email' className='text-sm font-medium text-card-foreground'>Email</label>
        <Input id='email' type='email' autoComplete='email' placeholder='you@example.com' aria-invalid={Boolean(errors.email)} className='h-11 bg-background' {...register('email')} />
        {errors.email ? <p className='text-xs text-destructive'>{errors.email.message}</p> : null}
        </div>
        <div className='space-y-2'>
        <label htmlFor='password' className='text-sm font-medium text-card-foreground'>Password</label>
        <Input id='password' type='password' autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder='At least 6 characters' aria-invalid={Boolean(errors.password)} className='h-11 bg-background' {...register('password')} />
        {errors.password ? <p className='text-xs text-destructive'>{errors.password.message}</p> : null}
        </div>
        <Button type='submit' disabled={pending} className='celestia-primary-action h-11 w-full rounded'>
          {isSignUp ? <Mail className='size-4' /> : <KeyRound className='size-4' />}
          {pending ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </Button>
        {!isSignUp ? (
          <div className='flex items-center justify-between gap-3 text-sm'>
            <Button asChild variant='link' size='sm' className='px-0'>
              <Link href='/auth/sign-up'>Create an account</Link>
            </Button>
            <Button type='button' variant='link' size='sm' disabled className='px-0 text-muted-foreground' title='Coming soon'>
              Forgot password?
            </Button>
          </div>
        ) : null}
      </form>
      {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
      {error ? <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>{error}</p> : null}
    </div>
  );
};

export default AuthMethods;
