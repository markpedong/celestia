'use client';

import { FC, useState, useTransition } from 'react';
import { z } from 'zod';
import Link from 'next/link';
import { KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';
import { REDIRECT_FORGOT, MIN_PASSWORD_LENGTH, PASSWORD_RECOVERY } from '@/constants';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { updateRecoveredPasswordAction } from '@/lib/actions/security';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';

const PasswordRecoveryForm: FC<{ mode: 'request' | 'update' }> = ({ mode }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [pending, startTransition] = useTransition();
  const isRequest = mode === 'request';
  const { passwordRecoverySchema } = useFormSchema();
  const schema = isRequest
    ? z.object({ email: z.email().trim(), password: z.string(), confirmPassword: z.string() })
    : passwordRecoverySchema;

  const {
    register,
    handleSubmit,
    setError,
    onFormKeyDown,
    formState: { errors },
  } = useFormValidate({ schema, defaultValues: PASSWORD_RECOVERY });

  const signOutToSignIn = async () => {
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign('/auth/sign-in');
  };

  const onSubmit = (values: z.infer<typeof schema>) => {
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
      if (isRequest) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}${REDIRECT_FORGOT}`,
        });
        if (error) {
          setError('email', { message: error.message });
          return;
        }
        setMessage('If an account exists for that email, a reset link is on its way.');
        return;
      }

      const result = await updateRecoveredPasswordAction({
        newPassword: values.password,
        confirmPassword: values.confirmPassword,
      });
      if (result?.error) {
        setError('password', { message: result.error });
        return;
      }
      await signOutToSignIn();
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={onFormKeyDown}
      className='space-y-4'
      noValidate
      autoComplete={isRequest ? undefined : 'off'}
    >
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
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </>
      )}
      <Button
        type='submit'
        isLoading={pending}
        loadingText={isRequest ? 'Sending reset link...' : 'Updating password...'}
        className='celestia-primary-action w-full rounded'
      >
        {isRequest ? <Mail /> : <KeyRound />}
        {isRequest ? 'Send reset link' : 'Update password'}
      </Button>
      {isRequest ? (
        <Button asChild variant='link' size='sm' className='w-full'>
          <Link href='/auth/sign-in'>Back to sign in</Link>
        </Button>
      ) : (
        <Button
          type='button'
          variant='link'
          size='sm'
          className='w-full'
          isLoading={isSigningOut}
          loadingText='Signing out...'
          onClick={signOutToSignIn}
        >
          Back to sign in
        </Button>
      )}
      {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
    </form>
  );
};

export default PasswordRecoveryForm;
