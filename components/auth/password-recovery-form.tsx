'use client';

import { FC, useState, useTransition } from 'react';
import Link from 'next/link';
import { KeyRound, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, PasswordField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  REDIRECT_FORGOT,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RECOVERY,
} from '@/constants';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { PasswordRecoveryValues } from '@/lib/types';
import { ENTER_VALID_EMAIL, MIN_MAX_PASS } from '@/constants/messages';

const PasswordRecoveryForm: FC<{ mode: 'request' | 'update' }> = ({ mode }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isRequest = mode === 'request';

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<PasswordRecoveryValues>({
    defaultValues: PASSWORD_RECOVERY,
  });

  const onSubmit = handleSubmit(values => {
    setMessage(null);

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      const result = isRequest
        ? await supabase.auth.resetPasswordForEmail(values.email.trim().toLowerCase(), { redirectTo: REDIRECT_FORGOT })
        : await supabase.auth.updateUser({ password: values.password });

      if (result.error) {
        setError(isRequest ? 'email' : 'password', {
          message: isRequest
            ? 'We could not send a reset email. Please try again.'
            : 'We could not update your password. Request a new reset link and try again.',
        });
        return;
      }

      if (isRequest) setMessage('If an account exists for that email, a reset link is on its way.');
      else window.location.assign('/');
    });
  });

  return (
    <form onSubmit={onSubmit} className='space-y-4' noValidate autoComplete={isRequest ? undefined : 'off'}>
      {isRequest ? (
        <FormField htmlFor='email' label='Email' labelClassName='text-card-foreground' error={errors.email?.message}>
          <Input
            id='email'
            type='email'
            autoComplete='email'
            maxLength={MAX_EMAIL_LENGTH}
            placeholder='you@example.com'
            className='h-11 bg-background'
            aria-invalid={Boolean(errors.email)}
            {...register('email', {
              required: 'Email is required.',
              maxLength: {
                value: MAX_EMAIL_LENGTH,
                message: `Email must be at most ${MAX_EMAIL_LENGTH} characters.`,
              },
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: ENTER_VALID_EMAIL,
              },
            })}
          />
        </FormField>
      ) : (
        <>
          <PasswordField
            id='password'
            label='New password'
            labelClassName='text-card-foreground'
            autoComplete='new-password'
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            className='h-11 bg-background'
            error={errors.password?.message}
            aria-invalid={Boolean(errors.password)}
            {...register('password', {
              required: 'Password is required.',
              minLength: { value: MIN_PASSWORD_LENGTH, message: MIN_MAX_PASS },
              maxLength: { value: MAX_PASSWORD_LENGTH, message: MIN_MAX_PASS },
            })}
          />

          <PasswordField
            id='confirm-password'
            label='Confirm new password'
            labelClassName='text-card-foreground'
            autoComplete='new-password'
            placeholder='Re-enter your password'
            className='h-11 bg-background'
            error={errors.confirmPassword?.message}
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register('confirmPassword', {
              required: 'Confirm your password.',
              validate: value => value === watch('password') || 'Passwords do not match.',
            })}
          />
        </>
      )}
      <Button
        type='submit'
        isLoading={pending}
        loadingText={isRequest ? 'Sending reset link...' : 'Updating password...'}
        className='celestia-primary-action h-11 w-full rounded'
      >
        {isRequest ? <Mail className='size-4' /> : <KeyRound className='size-4' />}
        {isRequest ? 'Send reset link' : 'Update password'}
      </Button>
      <Button asChild variant='link' size='sm' className='w-full'>
        <Link href='/auth/sign-in'>Back to sign in</Link>
      </Button>
      {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
    </form>
  );
};

export default PasswordRecoveryForm;
