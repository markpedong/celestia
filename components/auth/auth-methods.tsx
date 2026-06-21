'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthForm } from '@/hooks/use-auth-form';
import { MAX_DISPLAY_NAME_LENGTH } from '@/lib/constants';
import type { AuthMethodsProps } from '@/lib/types';
import { Apple, Globe, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';

const AuthMethods: FC<AuthMethodsProps> = ({ mode }: AuthMethodsProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted, isValid, touchedFields },
    continueWithProvider,
    error,
    isSignUp,
    message,
    onFormKeyDown,
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
      <form onSubmit={handleSubmit(submit)} onKeyDown={onFormKeyDown} className='space-y-4' noValidate>
        {isSignUp ? (
        <div className='space-y-2'>
          <label htmlFor='name' className='text-sm font-medium text-card-foreground'>Display name</label>
          <Input id='name' placeholder='Your name' maxLength={MAX_DISPLAY_NAME_LENGTH} aria-invalid={Boolean(errors.name && (touchedFields.name || isSubmitted))} className='h-11 bg-background' {...register('name')} />
          {errors.name && (touchedFields.name || isSubmitted) ? <p className='text-xs text-destructive'>{errors.name.message}</p> : null}
        </div>
        ) : null}
        <div className='space-y-2'>
        <label htmlFor='email' className='text-sm font-medium text-card-foreground'>Email</label>
        <Input id='email' type='email' autoComplete='email' placeholder='you@example.com' aria-invalid={Boolean(errors.email && (touchedFields.email || isSubmitted))} className='h-11 bg-background' {...register('email')} />
        {errors.email && (touchedFields.email || isSubmitted) ? <p className='text-xs text-destructive'>{errors.email.message}</p> : null}
        </div>
        <div className='space-y-2'>
        <label htmlFor='password' className='text-sm font-medium text-card-foreground'>Password</label>
        <Input id='password' type='password' autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder='At least 6 characters' aria-invalid={Boolean(errors.password && (touchedFields.password || isSubmitted))} className='h-11 bg-background' {...register('password')} />
        {errors.password && (touchedFields.password || isSubmitted) ? <p className='text-xs text-destructive'>{errors.password.message}</p> : null}
        </div>
        {isSignUp ? (
          <div className='space-y-2'>
            <label htmlFor='confirmPassword' className='text-sm font-medium text-card-foreground'>Confirm password</label>
            <Input id='confirmPassword' type='password' autoComplete='new-password' placeholder='Re-enter your password' aria-invalid={Boolean(errors.confirmPassword && (touchedFields.confirmPassword || isSubmitted))} className='h-11 bg-background' {...register('confirmPassword')} />
            {errors.confirmPassword && (touchedFields.confirmPassword || isSubmitted) ? <p className='text-xs text-destructive'>{errors.confirmPassword.message}</p> : null}
          </div>
        ) : null}
        <Button type='submit' disabled={pending || !isValid} className='celestia-primary-action h-11 w-full rounded'>
          {isSignUp ? <Mail className='size-4' /> : <KeyRound className='size-4' />}
          {pending ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </Button>
        <div className='flex items-center justify-between gap-3 text-sm'>
          <Button asChild variant='link' size='sm' className='px-0'>
            <Link href={isSignUp ? '/auth/sign-in' : '/auth/sign-up'}>
              {isSignUp ? 'Already have an account?' : 'Create an account'}
            </Link>
          </Button>
          <Button type='button' variant='link' size='sm' disabled className='px-0 text-muted-foreground' title='Coming soon'>
            Forgot password?
          </Button>
        </div>
      </form>
      {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
      {error ? <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>{error}</p> : null}
    </div>
  );
};

export default AuthMethods;
