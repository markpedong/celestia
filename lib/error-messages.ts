type AuthIntent = 'sign-in' | 'sign-up' | 'oauth';

export const getAuthErrorMessage = (message: string, intent: AuthIntent): string => {
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

export const getUploadErrorMessage = (error: unknown, fallback: string): string => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('png, jpeg, webp, or gif') || message.includes('2 mb') || message.includes('up to')) {
    return error instanceof Error ? error.message : fallback;
  }
  if (message.includes('bucket') || message.includes('storage')) {
    return 'Image storage is not ready yet. Please try again later.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Your image could not be uploaded because the network request failed. Please try again.';
  }

  return fallback;
};
