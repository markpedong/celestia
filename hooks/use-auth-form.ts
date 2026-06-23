'use client';

import type { Provider } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getEmailByUsername } from '@/services';
import type { AuthMode } from '@/lib/types';
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/constants';
import { useZodForm } from './use-zod-form';

const supabase = createSupabaseBrowserClient();

const usernameSchema = z.string().trim().min(3, 'Username must be at least 3 characters.').max(20, 'Username must be 20 characters or fewer.').regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, or underscores.');

const authSchema = z.object({
  username: usernameSchema.optional(),
  email: z.string().trim().min(1, 'Enter your email or username.').max(MAX_EMAIL_LENGTH, 'Email address or username is too long.'),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`).max(MAX_PASSWORD_LENGTH, `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`),
  confirmPassword: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;
type AuthIntent = 'sign-in' | 'sign-up' | 'oauth' | 'passkey';

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
  if (intent === 'passkey') return 'We could not sign you in with a passkey. Try another sign-in method.';
  if (intent === 'sign-up') return 'We could not create your account. Please try again.';
  return 'We could not sign you in. Please try again.';
};

const getInitialDisplayName = async (fallback: string) => {
  try {
    const response = await fetch('https://random-word-api.herokuapp.com/word?number=2');
    const words = await response.json();
    if (Array.isArray(words) && words.length === 2 && words.every(word => typeof word === 'string')) {
      return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  } catch { }
  return fallback.trim() || 'New User';
};

export const useAuthForm = (mode: AuthMode) => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === 'sign-up';
  const schema = authSchema.superRefine((values, context) => {
    if (!isSignUp) return;

    if (!usernameSchema.safeParse(values.username).success) {
      context.addIssue({ code: 'custom', message: 'Use 3-20 lowercase letters, numbers, or underscores.', path: ['username'] });
    }

    if (!z.string().email().safeParse(values.email).success) {
      context.addIssue({ code: 'custom', message: 'Enter a valid email address.', path: ['email'] });
    }

    if (!values.confirmPassword) {
      context.addIssue({ code: 'custom', message: 'Please confirm your password.', path: ['confirmPassword'] });
    } else if (values.password !== values.confirmPassword) {
      context.addIssue({ code: 'custom', message: 'Passwords do not match.', path: ['confirmPassword'] });
    }
  });
  const form = useZodForm<AuthValues>(schema, { username: '', email: '', password: '', confirmPassword: '' });

  const submit = (values: AuthValues) => {
    setMessage(null);

    startTransition(async () => {
      let email = values.email.trim().toLowerCase();
      if (!isSignUp && !email.includes('@')) {
        console.log('email', email);
        const usernameEmail = await getEmailByUsername(email);
        if (!usernameEmail) {
          toast.error('That email, username, or password is incorrect. Check your details and try again.');
          return;
        }
        email = usernameEmail;
      }
      const fallbackUsername = email.split('@')[0];
      const requestedUsername = isSignUp ? values.username?.trim().toLowerCase() : undefined;
      const displayName = isSignUp ? await getInitialDisplayName(requestedUsername ?? fallbackUsername) : undefined;
      const result = isSignUp
        ? await supabase.auth.signUp({
          email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/sign-in`,
            data: { display_name: displayName, username: requestedUsername },
          },
        })
        : await supabase.auth.signInWithPassword({ email, password: values.password });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error.message, isSignUp ? 'sign-up' : 'sign-in'));
        return;
      }

      if (result.data.session && result.data.user) {
        const username = typeof result.data.user.user_metadata.username === 'string' ? result.data.user.user_metadata.username : requestedUsername ?? fallbackUsername;
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: result.data.user.id,
            username,
            email: result.data.user.email,
            avatar_url: `https://api.dicebear.com/9.x/thumbs/svg?seed=${result.data.user.email ?? email}`,
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

  const continueWithProvider = (provider: Extract<Provider, 'google' | 'apple'>) => {
    setMessage(null);

    startTransition(async () => {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) toast.error(getAuthErrorMessage(oauthError.message, 'oauth'));
    });
  };

  const continueWithPasskey = () => {
    setMessage(null);

    startTransition(async () => {
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error || !data.session || !data.user) {
        toast.error(getAuthErrorMessage(error?.message ?? 'Passkey sign-in did not complete.', 'passkey'));
        return;
      }
      router.replace('/');
      router.refresh();
    });
  };

  return { ...form, continueWithPasskey, continueWithProvider, isSignUp, message, pending, submit };
};
