'use client';

import type { Provider } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AuthMode } from '@/lib/types';
import { useZodForm } from './use-zod-form';

const supabase = createSupabaseBrowserClient();

const authSchema = z.object({
  name: z.string().trim().max(60, 'Display name must be 60 characters or fewer.'),
  email: z.string().trim().email('Enter a valid email address.').max(254, 'Email address is too long.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(72, 'Password must be 72 characters or fewer.'),
});

type AuthValues = z.infer<typeof authSchema>;

export const useAuthForm = (mode: AuthMode) => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === 'sign-up';
  const form = useZodForm<AuthValues>(authSchema, { name: '', email: '', password: '' });

  const submit = (values: AuthValues) => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const email = values.email.trim().toLowerCase();
      const result = isSignUp
        ? await supabase.auth.signUp({
            email,
            password: values.password,
            options: {
              data: { full_name: values.name.trim() || email.split('@')[0] },
              emailRedirectTo: `${window.location.origin}/auth/sign-in`,
            },
          })
        : await supabase.auth.signInWithPassword({ email, password: values.password });

      if (result.error) {
        setError(result.error.message);
        return;
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
      if (oauthError) setError(oauthError.message);
    });
  };

  return { ...form, continueWithProvider, error, isSignUp, message, pending, submit };
};
