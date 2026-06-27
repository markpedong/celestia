'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';
import { useAuthForm } from '@/hooks/use-auth-form';
import type { AuthMethodsProps } from '@/lib/types';
import { Fingerprint, KeyRound, Mail, ShieldCheck } from 'lucide-react';
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
    backupCode,
    cancelMfaChallenge,
    register,
    handleSubmit,
    formState: { errors, isSubmitted, isValid, touchedFields },
    continueWithPasskey,
    continueWithProvider,
    hasBackupCodes,
    isSignUp,
    message,
    mfaCode,
    mfaStep,
    onFormKeyDown,
    pending,
    setBackupCode,
    setMfaCode,
    showMfaStep,
    submit,
    submitBackupCode,
    submitMfaCode,
  } = useAuthForm(mode);

  if (mfaStep) {
    const isBackupCode = mfaStep === 'backup';
    const currentCode = isBackupCode ? backupCode : mfaCode;
    const verifyMfaStep = () => {
      if (!currentCode.trim() || pending) return;

      if (isBackupCode) {
        submitBackupCode();
        return;
      }

      submitMfaCode();
    };

    return (
      <div className='space-y-4'>
        <div className='space-y-1 text-center'>
          <div className='mx-auto grid size-10 place-items-center rounded-sm border border-border bg-muted'>
            <ShieldCheck className='size-5 text-muted-foreground' />
          </div>
          <h2 className='text-lg font-semibold text-card-foreground'>
            {isBackupCode ? 'Use a backup code' : 'Two-factor authentication'}
          </h2>
        </div>
        <form
          onSubmit={event => {
            event.preventDefault();
            verifyMfaStep();
          }}
          onKeyDown={event => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
            event.preventDefault();
            verifyMfaStep();
          }}
          className='space-y-4'
        >
          <FormField
            label={isBackupCode ? 'Backup code' : 'Verification code'}
            labelClassName='text-card-foreground'
            placeholder={isBackupCode ? 'Enter one-time backup code' : 'Enter 6-digit code'}
            value={isBackupCode ? backupCode : mfaCode}
            onChange={event => (isBackupCode ? setBackupCode(event.target.value) : setMfaCode(event.target.value))}
            autoCapitalize='characters'
            autoComplete='one-time-code'
            inputMode={isBackupCode ? 'text' : 'numeric'}
          />
          <Button
            type='submit'
            disabled={!currentCode.trim()}
            isLoading={pending}
            loadingText={isBackupCode ? 'Checking code...' : 'Verifying...'}
            className='celestia-primary-action h-11 w-full'
          >
            <ShieldCheck /> {isBackupCode ? 'Continue' : 'Verify and continue'}
          </Button>
          {isBackupCode || hasBackupCodes ? (
            <Button
              type='button'
              variant='ghost'
              className='w-full'
              onClick={() => showMfaStep(isBackupCode ? 'totp' : 'backup')}
              disabled={pending}
            >
              {isBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
            </Button>
          ) : null}
          <Button type='button' variant='ghost' className='w-full' onClick={cancelMfaChallenge} disabled={pending}>
            Use a different sign-in method
          </Button>
        </form>
        {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
      </div>
    );
  }

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
