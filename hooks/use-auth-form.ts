'use client';

import type { Provider } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getBackupCodeStatusAction, verifyBackupCodeAction } from '@/lib/actions/security';
import { getEmailByUserName, getInitialDisplayName } from '@/services';
import type { AuthMode } from '@/lib/types';
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/constants';
import useFormValidate from './useFormValidate';
import { ENTER_VALID_EMAIL } from '@/constants/messages';

const supabase = createSupabaseBrowserClient();

const usernameSchema = z.string().trim()
  .min(6, 'Username must be at least 3 characters.')
  .max(20, 'Username must be 20 characters or fewer.')
  .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, or underscores.');

const authSchema = z.object({
  userName: usernameSchema,
  email: z.string().trim().min(1, 'Enter your email or userName.').max(MAX_EMAIL_LENGTH, 'Email address or userName is too long.'),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`).max(MAX_PASSWORD_LENGTH, `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`),
  confirmPassword: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;
type MfaStep = 'totp' | 'backup' | null;
const formatVerificationCode = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export const useAuthForm = (mode: AuthMode) => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [backupCode, setBackupCode] = useState('');
  const [hasBackupCodes, setHasBackupCodes] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaStep, setMfaStep] = useState<MfaStep>(null);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === 'sign-up';
  const isSignIn = mode === 'sign-in';
  const schema = authSchema.superRefine((values, context) => {
    if (!isSignUp) return;

    if (!usernameSchema.safeParse(values.userName).success) {
      context.addIssue({ code: 'custom', message: 'Use 3-20 lowercase letters, numbers, or underscores.', path: ['userName'] });
    }

    if (!z.string().email().safeParse(values.email).success) {
      context.addIssue({ code: 'custom', message: ENTER_VALID_EMAIL, path: ['email'] });
    }

    if (!values.confirmPassword) {
      context.addIssue({ code: 'custom', message: 'Please confirm your password.', path: ['confirmPassword'] });
    } else if (values.password !== values.confirmPassword) {
      context.addIssue({ code: 'custom', message: 'Passwords do not match.', path: ['confirmPassword'] });
    }
  });
  const form = useFormValidate<AuthValues>({
    schema,
    defaultValues: { userName: isSignIn ? 'sign_in' : '', email: '', password: '', confirmPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const submit = (values: AuthValues) => {
    setMessage(null);

    startTransition(async () => {
      let email = values.email.trim().toLowerCase();
      if (isSignIn && !email.includes('@')) {
        const userNameEmail = await getEmailByUserName(email);

        if (!userNameEmail) {
          toast.error('That email, userName, or password is incorrect. Check your details and try again.');
          return;
        }

        email = userNameEmail;
      }


      const result = isSignUp
        ? await supabase.auth.signUp({
          email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/sign-in`,
            data: { display_name: await getInitialDisplayName(), userName: values.userName },
          },
        })
        : await supabase.auth.signInWithPassword({ email, password: values.password });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      if (result.data.session && result.data.user) {
        if (isSignIn) {
          const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (!assurance.error && assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') {
            const backupCodeStatus = await getBackupCodeStatusAction();
            setHasBackupCodes(backupCodeStatus?.hasBackupCodes === true);
            setMfaStep('totp');
            setMessage('Enter the code from your authenticator app to finish signing in.');
            return;
          }
        }

        const userName = typeof result.data.user.user_metadata.userName === 'string' ? result.data.user.user_metadata.userName : values.userName;
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: result.data.user.id,
            username: userName,
            email: result.data.user.email,
            display_name: result.data.user.user_metadata.display_name,
            avatar_url: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(result.data.user.email ?? email)}`,
          }, { ignoreDuplicates: true });

        if (profileError) {
          toast.error(profileError.message);
          return;
        }
      }

      if (isSignUp && !result.data.session) {
        setMessage('Check your inbox to confirm your account, then sign in.');
        return;
      }

      router.replace('/');
      router.refresh();
    });
  };

  const showMfaStep = (step: Exclude<MfaStep, null>) => {
    setBackupCode('');
    setMfaCode('');
    setMfaStep(step);
    setMessage(step === 'backup'
      ? 'Enter one of your saved backup codes to finish signing in.'
      : 'Enter the code from your authenticator app to finish signing in.');
  };

  const submitMfaCode = () => {
    setMessage(null);

    startTransition(async () => {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) {
        toast.error(factors.error.message);
        return;
      }

      const factor = factors.data.totp.find(({ status }) => status === 'verified');
      if (!factor) {
        toast.error('No verified authenticator app was found for this account.');
        return;
      }

      const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
      const result = challenge.error
        ? challenge
        : await supabase.auth.mfa.verify({
            factorId: factor.id,
            challengeId: challenge.data.id,
            code: formatVerificationCode(mfaCode),
          });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      setMfaCode('');
      setMfaStep(null);
      router.replace('/');
      router.refresh();
    });
  };

  const submitBackupCode = () => {
    setMessage(null);

    startTransition(async () => {
      const result = await verifyBackupCodeAction(backupCode);

      if (!result || result.error) {
        toast.error(result?.error ?? 'Unable to verify that backup code.');
        return;
      }

      if (result.remainingCodes === 0) {
        setHasBackupCodes(false);
        toast.warning('That was your last backup code. Generate a new set after signing in.');
      } else {
        toast.success(result.success ?? 'Backup code accepted.');
      }

      setBackupCode('');
      setMfaStep(null);
      router.replace('/');
      router.refresh();
    });
  };

  const cancelMfaChallenge = () => {
    startTransition(async () => {
      await supabase.auth.signOut();
      setBackupCode('');
      setHasBackupCodes(false);
      setMfaCode('');
      setMfaStep(null);
      setMessage(null);
    });
  };

  const continueWithProvider = (provider: Extract<Provider, 'google' | 'apple'>) => {
    setMessage(null);

    startTransition(async () => {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (oauthError) {
        toast.error(oauthError.message);
        return;
      }

      if (data.url) window.location.assign(data.url);
    });
  };

  const continueWithPasskey = () => {
    setMessage(null);

    startTransition(async () => {
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error || !data.session || !data.user) {
        toast.error(error?.message);
        return;
      }
      router.replace('/');
      router.refresh();
    });
  };

  return {
    ...form,
    backupCode,
    cancelMfaChallenge,
    continueWithPasskey,
    continueWithProvider,
    hasBackupCodes,
    isSignUp,
    message,
    mfaCode,
    mfaStep,
    pending,
    setBackupCode,
    setMfaCode: (value: string) => setMfaCode(formatVerificationCode(value)),
    showMfaStep,
    submit,
    submitBackupCode,
    submitMfaCode,
  };
};
