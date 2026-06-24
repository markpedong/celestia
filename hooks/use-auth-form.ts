'use client';

import type { Provider } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getEmailByUsername, getInitialDisplayName } from '@/services';
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
  username: usernameSchema,
  email: z.string().trim().min(1, 'Enter your email or username.').max(MAX_EMAIL_LENGTH, 'Email address or username is too long.'),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`).max(MAX_PASSWORD_LENGTH, `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`),
  confirmPassword: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;

export const useAuthForm = (mode: AuthMode) => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === 'sign-up';
  const isSignIn = mode === 'sign-in';
  const schema = authSchema.superRefine((values, context) => {
    if (!isSignUp) return;

    if (!usernameSchema.safeParse(values.username).success) {
      context.addIssue({ code: 'custom', message: 'Use 3-20 lowercase letters, numbers, or underscores.', path: ['username'] });
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
    defaultValues: { username: isSignIn ? 'sign_in' : '', email: '', password: '', confirmPassword: '' },
  });

  const submit = (values: AuthValues) => {
    setMessage(null);

    startTransition(async () => {
      const email = values.email.trim().toLowerCase();
      if (isSignIn) {
        const usernameEmail = await getEmailByUsername(email);

        if (!usernameEmail) {
          toast.error('That email, username, or password is incorrect. Check your details and try again.');
          return;
        }

      }


      const result = isSignUp
        ? await supabase.auth.signUp({
          email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/sign-in`,
            data: { display_name: await getInitialDisplayName(), username: values.username },
          },
        })
        : await supabase.auth.signInWithPassword({ email, password: values.password });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      if (result.data.session && result.data.user) {
        const username = typeof result.data.user.user_metadata.username === 'string' ? result.data.user.user_metadata.username : values.username;
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: result.data.user.id,
            username,
            email: result.data.user.email,
            display_name: result.data.user.user_metadata.display_name,
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
      if (oauthError) toast.error(oauthError.message);
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

  return { ...form, continueWithPasskey, continueWithProvider, isSignUp, message, pending, submit };
};
