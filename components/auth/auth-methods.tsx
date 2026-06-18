'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAuthClient } from '@neondatabase/auth/next';
import { AppleIcon, GoogleIcon } from '@neondatabase/auth/react';
import { Link2, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useState, useTransition } from 'react';

type Method = 'phone' | 'email' | null;
type Provider = 'google' | 'apple';

const authClient = createAuthClient();

const AuthMethodButton = ({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) => (
  <button
    type='button'
    onClick={onClick}
    className='relative flex h-14 w-full items-center justify-center rounded-full border border-border bg-white px-5 text-base font-medium text-zinc-950 shadow-sm transition hover:bg-zinc-100'
  >
    <span className='absolute left-5 flex size-6 items-center justify-center text-zinc-950'>{icon}</span>
    {children}
  </button>
);

const AuthMethods = () => {
  const router = useRouter();
  const [activeMethod, setActiveMethod] = useState<Method>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const resetStatus = () => {
    setError(null);
    setMessage(null);
  };

  const continueWithSocial = (provider: Provider) => {
    resetStatus();

    startTransition(async () => {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: '/',
        errorCallbackURL: '/auth/sign-in',
      });

      if (result.error) {
        setError(result.error.message ?? `Could not continue with ${provider}.`);
        return;
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    });
  };

  const sendEmailOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();

    startTransition(async () => {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });

      if (result.error) {
        setError(result.error.message ?? 'Could not send the one-time code.');
        return;
      }

      setOtpSent(true);
      setMessage('Check your email for the one-time code.');
    });
  };

  const verifyEmailOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();

    startTransition(async () => {
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (result.error) {
        setError(result.error.message ?? 'The code could not be verified.');
        return;
      }

      router.push('/');
      router.refresh();
    });
  };

  return (
    <div className='space-y-3'>
      <AuthMethodButton
        icon={<Phone className='size-5' strokeWidth={2.2} />}
        onClick={() => {
          resetStatus();
          setActiveMethod('phone');
        }}
      >
        Continue with Phone Number
      </AuthMethodButton>
      <AuthMethodButton icon={<GoogleIcon className='size-6' />} onClick={() => continueWithSocial('google')}>
        Continue with Google
      </AuthMethodButton>
      <AuthMethodButton icon={<AppleIcon className='size-6' />} onClick={() => continueWithSocial('apple')}>
        Continue with Apple
      </AuthMethodButton>
      <AuthMethodButton
        icon={<Link2 className='size-5' strokeWidth={2.4} />}
        onClick={() => {
          resetStatus();
          setActiveMethod('email');
        }}
      >
        Email me a one-time code
      </AuthMethodButton>

      {activeMethod === 'phone' ? (
        <div className='rounded-xl border border-border bg-secondary/60 p-4 text-sm text-muted-foreground'>
          Phone sign-in needs a phone/SMS provider configured in Neon Auth before it can be enabled here.
        </div>
      ) : null}

      {activeMethod === 'email' ? (
        <div className='rounded-xl border border-border bg-secondary/60 p-4'>
          {!otpSent ? (
            <form onSubmit={sendEmailOtp} className='space-y-3'>
              <Input
                type='email'
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder='you@example.com'
                required
                className='h-10 bg-background'
              />
              <Button type='submit' disabled={pending} className='celestia-primary-action w-full'>
                {pending ? 'Sending...' : 'Send one-time code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyEmailOtp} className='space-y-3'>
              <Input
                inputMode='numeric'
                value={otp}
                onChange={event => setOtp(event.target.value)}
                placeholder='Enter code'
                required
                className='h-10 bg-background'
              />
              <Button type='submit' disabled={pending} className='celestia-primary-action w-full'>
                {pending ? 'Verifying...' : 'Continue'}
              </Button>
            </form>
          )}
        </div>
      ) : null}

      {message ? <p className='text-center text-sm text-muted-foreground'>{message}</p> : null}
      {error ? (
        <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default AuthMethods;
