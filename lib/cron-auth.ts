import { timingSafeEqual } from 'node:crypto';

/** Separate Authorization header check; never compare or log secrets in responses. */
export const isAuthorizedCronRequest = (authorization: string | null, secret: string | undefined) => {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!secret || !token) return false;
  const expected = Buffer.from(secret);
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
};
