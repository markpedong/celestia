'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';
import { useAuthForm } from '@/hooks/use-auth-form';
import type { AuthMethodsProps } from '@/lib/types';
import { Fingerprint, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';

const AuthMethods: FC<AuthMethodsProps> = ({ mode }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted, isValid, touchedFields },
    continueWithPasskey,
    continueWithProvider,
    isSignUp,
    message,
    onFormKeyDown,
    pending,
    submit,
  } = useAuthForm(mode);

  return (
    <div className='space-y-4'>
      <div className='grid gap-2 sm:grid-cols-2'>
        <button
          type='button'
          onClick={() => continueWithProvider('google')}
          disabled={pending}
          className='flex h-11 items-center justify-center gap-2 rounded border border-border bg-background text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-60'
        >
          <svg aria-hidden='true' className='size-4' viewBox='0 0 24 24'>
            <path
              fill='#EA4335'
              d='M5.27 9.76A7.08 7.08 0 0 1 16.42 6.5L19.9 3A11.97 11.97 0 0 0 1.24 6.65l4.03 3.11Z'
            />
            <path
              fill='#34A853'
              d='M16.04 18.01A7.4 7.4 0 0 1 12 19.1a7.08 7.08 0 0 1-6.72-4.82l-4.04 3.06A11.96 11.96 0 0 0 12 24a11.4 11.4 0 0 0 7.83-3l-3.79-2.99Z'
            />
            <path
              fill='#4A90E2'
              d='M19.83 21c2.2-2.05 3.62-5.1 3.62-9 0-.7-.1-1.47-.27-2.18H12v4.63h6.44a5.4 5.4 0 0 1-2.4 3.56l3.8 2.99Z'
            />
            <path
              fill='#FBBC05'
              d='M5.28 14.27a7.12 7.12 0 0 1-.01-4.5L1.24 6.64A11.93 11.93 0 0 0 0 12c0 1.92.44 3.73 1.24 5.33l4.04-3.06Z'
            />
          </svg>
          Google
        </button>
        <button
          type='button'
          onClick={() => continueWithProvider('apple')}
          disabled={pending}
          className='flex h-11 items-center justify-center gap-2 rounded border border-border bg-background text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-60'
        >
          <svg aria-hidden='true' className='size-4 fill-current' viewBox='0 0 24 24'>
            <path d='M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701' />
          </svg>
          Apple
        </button>
      </div>
      {!isSignUp ? (
        <button
          type='button'
          onClick={continueWithPasskey}
          disabled={pending}
          className='flex h-11 w-full items-center justify-center gap-2 rounded border border-border bg-background text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-60'
        >
          <Fingerprint className='size-4' /> Continue with passkey
        </button>
      ) : null}
      <div className='flex items-center gap-3'>
        <span className='h-px flex-1 bg-border' />
        <span className='text-xs font-medium text-muted-foreground'>or continue with email</span>
        <span className='h-px flex-1 bg-border' />
      </div>
      <form onSubmit={handleSubmit(submit)} onKeyDown={onFormKeyDown} className='space-y-4' noValidate>
        {isSignUp && (
          <FormField
            label='Username'
            labelClassName='text-card-foreground'
            error={errors.username && (touchedFields.username || isSubmitted) ? errors.username.message : undefined}
            maxLength={20}
            {...register('username')}
          />
        )}
        <FormField
          label={isSignUp ? 'Email' : 'Email or username'}
          placeholder={isSignUp ? 'you@example.com' : 'you@example.com or username'}
          error={errors.email && (touchedFields.email || isSubmitted) ? errors.email.message : undefined}
          {...register('email')}
        />
        <FormField
          label='Password'
          labelClassName='text-card-foreground'
          type='password'
          placeholder='Enter your password'
          error={errors.password && (touchedFields.password || isSubmitted) ? errors.password.message : undefined}
          {...register('password')}
        />

        {isSignUp && (
          <FormField
            label='Confirm password'
            labelClassName='text-card-foreground'
            type='password'
            placeholder='Re-enter your password'
            error={errors.confirmPassword && (touchedFields.confirmPassword || isSubmitted) ? errors.confirmPassword.message : undefined}
            {...register('confirmPassword')}
          />
        )}
        <Button
          type='submit'
          disabled={!isValid}
          isLoading={pending}
          loadingText={isSignUp ? 'Creating account...' : 'Signing in...'}
          className='celestia-primary-action h-11 w-full rounded'
        >
          {isSignUp ? <Mail className='size-4' /> : <KeyRound className='size-4' />}
          {isSignUp ? 'Create account' : 'Sign in'}
        </Button>
        <div className='flex items-center justify-between gap-3 text-sm'>
          <Button asChild variant='link' size='sm' className='px-0'>
            <Link href={isSignUp ? '/auth/sign-in' : '/auth/sign-up'}>
              {isSignUp ? 'Already have an account?' : 'Create an account'}
            </Link>
          </Button>
          <Button asChild variant='link' size='sm' className='px-0'>
            <Link href='/auth/forgot-password'>Forgot password?</Link>
          </Button>
        </div>
      </form>
      {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
    </div>
  );
};

export default AuthMethods;
