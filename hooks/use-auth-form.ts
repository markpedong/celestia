'use client';

import type { Provider } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getBackupCodeStatusAction, verifyBackupCodeAction } from '@/lib/actions/security';
import { getInitialDisplayName } from '@/services';
import { signInWithUserName } from '@/services/username-session';
import type { AuthMode } from '@/lib/types';
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/constants';
import useFormValidate from './useFormValidate';
import { ENTER_VALID_EMAIL } from '@/constants/messages';

const supabase = createSupabaseBrowserClient();

const usernameSchema = z.string().trim()
  .min(3, 'Username must be at least 3 characters.')
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

  useEffect(() => {
    if (!isSignIn) return;
    if (new URLSearchParams(window.location.search).get('recovered') === '1') {
      void Promise.resolve().then(() => setMessage('Your authenticator was reset. Sign in again, enroll a new authenticator, and generate fresh backup codes.'));
      return;
    }
    void supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(async result => {
      if (result.error || result.data.nextLevel !== 'aal2' || result.data.currentLevel === 'aal2') return;
      const status = await getBackupCodeStatusAction();
      setHasBackupCodes(status?.hasBackupCodes === true);
      setMfaStep('totp');
      setMessage('Finish signing in with your authenticator, or use a backup code to reset your lost authenticator.');
    });
  }, [isSignIn]);
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
      const email = values.email.trim().toLowerCase();

      let result;
      try {
        result = isSignUp
          ? await supabase.auth.signUp({
          email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { display_name: await getInitialDisplayName(), userName: values.userName },
          },
        })
          : !email.includes('@')
            ? await signInWithUserName(supabase, email, values.password)
            : await supabase.auth.signInWithPassword({ email, password: values.password });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Sign-in failed. Please retry.');
        return;
      }

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
      ? 'A valid backup code will reset your authenticator and sign out all sessions. You will need to sign in again and enroll a new authenticator.'
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

      if (result.recoveryRequired) {
        setHasBackupCodes(false);
        setBackupCode('');
        setMfaStep(null);
        // Supabase revoked sessions when the verified factor was removed.
        // Never treat the legacy code as an AAL2 login.
        await supabase.auth.signOut({ scope: 'local' });
        window.location.assign('/auth/sign-in?recovered=1');
        return;
      }
      toast.error('Recovery did not complete. Please try again.');
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
