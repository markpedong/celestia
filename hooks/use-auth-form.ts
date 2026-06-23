'use client';

import type { Provider } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AuthMode } from '@/lib/types';
import { MAX_DISPLAY_NAME_LENGTH, MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/constants';
import { useZodForm } from './use-zod-form';

const supabase = createSupabaseBrowserClient();

const authSchema = z.object({
  name: z.string().trim().max(MAX_DISPLAY_NAME_LENGTH, `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`),
  email: z.string().trim().email('Enter a valid email address.').max(MAX_EMAIL_LENGTH, 'Email address is too long.'),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`).max(MAX_PASSWORD_LENGTH, `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`),
  confirmPassword: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;
type AuthIntent = 'sign-in' | 'sign-up' | 'oauth';

const getAuthErrorMessage = (message: string, intent: AuthIntent): string => {
  const normalized = message.toLowerCase();

  if (normalized.includes('user already registered') || normalized.includes('already been registered')) {
    return 'An account already exists for this email in Supabase Auth.';
  }
  if (normalized.includes('invalid login credentials')) {
    return 'That email or password is incorrect. Check your details and try again.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email from the message we sent, then try signing in again.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many attempts were made. Please wait a moment before trying again.';
  }
  if (normalized.includes('password should be at least')) {
    return 'Your password does not meet the minimum length requirement.';
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'We could not reach the authentication service. Check your connection and try again.';
  }

  if (intent === 'oauth') return 'We could not start that sign-in provider. Please try again.';
  if (intent === 'sign-up') return 'We could not create your account. Please try again.';
  return 'We could not sign you in. Please try again.';
};

export const useAuthForm = (mode: AuthMode) => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === 'sign-up';
  const schema = authSchema.superRefine((values, context) => {
    if (!isSignUp) return;

    if (!values.confirmPassword) {
      context.addIssue({ code: 'custom', message: 'Please confirm your password.', path: ['confirmPassword'] });
    } else if (values.password !== values.confirmPassword) {
      context.addIssue({ code: 'custom', message: 'Passwords do not match.', path: ['confirmPassword'] });
    }
  });
  const form = useZodForm<AuthValues>(schema, { name: '', email: '', password: '', confirmPassword: '' });

  const submit = (values: AuthValues) => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const email = values.email.trim().toLowerCase();
      const username = email.split('@')[0];
      const result = isSignUp
        ? await supabase.auth.signUp({
          email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/sign-in`,
          },
        })
        : await supabase.auth.signInWithPassword({ email, password: values.password });

      if (result.error) {
        setError(getAuthErrorMessage(result.error.message, isSignUp ? 'sign-up' : 'sign-in'));
        return;
      }

      if (result.data.session && result.data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: result.data.user.id,
            username,
            email: result.data.user.email,
            avatar_url: `https://api.dicebear.com/9.x/thumbs/svg?seed=${result.data.user.email ?? email}`,
          });

        if (profileError) {
          setError(profileError.message);
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

  const continueWithProvider = (provider: Extract<Provider, 'google' | 'apple'>) => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) setError(getAuthErrorMessage(oauthError.message, 'oauth'));
    });
  };

  return { ...form, continueWithProvider, error, isSignUp, message, pending, submit };
};
