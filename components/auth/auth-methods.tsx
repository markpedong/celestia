'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';
import { useAuthForm } from '@/hooks/use-auth-form';
import type { AuthMethodsProps } from '@/lib/types';
import { Fingerprint, KeyRound, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const providers = [
  { id: 'google', label: 'Google', icon: '/images/google.svg' },
  { id: 'apple', label: 'Apple', icon: '/images/apple.svg' },
] as const;

const authOptionClassName =
  'flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-background text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-60';

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
        {providers.map(({ id, label, icon }) => (
          <button
            key={id}
            type='button'
            onClick={() => continueWithProvider(id)}
            disabled={pending}
            className={authOptionClassName}
          >
            <Image
              src={icon}
              alt=''
              width={16}
              height={16}
              aria-hidden
              className={id === 'apple' ? 'dark:invert' : undefined}
            />
            {label}
          </button>
        ))}
      </div>
      {!isSignUp ? (
        <button
          type='button'
          onClick={continueWithPasskey}
          disabled={pending}
          className={`${authOptionClassName} w-full`}
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
            placeholder='johndoe'
            error={errors.userName && (touchedFields.userName || isSubmitted) ? errors.userName.message : undefined}
            maxLength={20}
            {...register('userName')}
          />
        )}
        <FormField
          label={isSignUp ? 'Email' : 'Email or userName'}
          placeholder={isSignUp ? 'you@example.com' : 'you@example.com or userName'}
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
            error={
              errors.confirmPassword && (touchedFields.confirmPassword || isSubmitted)
                ? errors.confirmPassword.message
                : undefined
            }
            {...register('confirmPassword')}
          />
        )}
        <Button
          type='submit'
          disabled={!isValid}
          isLoading={pending}
          loadingText={isSignUp ? 'Creating account...' : 'Signing in...'}
          className='celestia-primary-action h-11 w-full'
        >
          {isSignUp ? <Mail /> : <KeyRound />}
          {isSignUp ? 'Create account' : 'Sign in'}
        </Button>
        <div className='flex items-center justify-between'>
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
