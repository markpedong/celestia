import { prisma } from '@/lib/prisma';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const POST = async (request: Request) => {
  const { userName } = await request.json();
  const normalizedUserName = typeof userName === 'string' ? userName.trim().toLowerCase() : '';
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!await checkRateLimit(`username-login:${forwardedFor}`, 30, 60)) {
    return generateErrorResponse('Too many sign-in attempts. Try again in a moment.', 429);
  }
  if (!/^[a-z0-9_]{3,28}$/.test(normalizedUserName)) return generateErrorResponse('Invalid credentials', 404);

  const profile = await prisma.users.findUnique({
    where: { userName: normalizedUserName },
    select: { email: true },
  });

  if (!profile?.email) return generateErrorResponse('Invalid credentials', 404);

  return generateSuccessResponse({ email: profile.email });
};
