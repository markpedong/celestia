'use client';

import { FC, useState, useTransition } from 'react';
import Link from 'next/link';
import { KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';
import { REDIRECT_FORGOT, MIN_PASSWORD_LENGTH, PASSWORD_RECOVERY } from '@/constants';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { passwordRecoverySchema } from '@/lib/form-schemas';
import { useZodForm } from '@/hooks/use-zod-form';

const PasswordRecoveryForm: FC<{ mode: 'request' | 'update' }> = ({ mode }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isRequest = mode === 'request';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useZodForm(passwordRecoverySchema, PASSWORD_RECOVERY);

  const onSubmit = handleSubmit(values => {
    if (isRequest && !/^\S+@\S+\.\S+$/.test(values.email)) {
      setError('email', { message: 'Enter a valid email address.' });
      return;
    }
    if (!isRequest && values.password.length < MIN_PASSWORD_LENGTH) {
      setError('password', { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }
    if (!isRequest && values.password !== values.confirmPassword) {
      setError('confirmPassword', { message: 'Passwords do not match.' });
      return;
    }
    setMessage(null);

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      const result = isRequest
        ? await supabase.auth.resetPasswordForEmail(values.email.trim().toLowerCase(), {
            redirectTo: `${window.location.origin}${REDIRECT_FORGOT}`,
          })
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
        <FormField
          type='email'
          label='Email'
          placeholder='you@example.com'
          labelClassName='text-card-foreground'
          error={errors.email?.message}
          {...register('email')}
        />
      ) : (
        <>
          <FormField
            type='password'
            label='New password'
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            labelClassName='text-card-foreground'
            error={errors.password?.message}
            {...register('password')}
          />
          <FormField
            type='password'
            label='Confirm new password'
            placeholder='Re-enter your password'
            labelClassName='text-card-foreground'
            error={errors.password?.message}
            {...register('confirmPassword')}
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
