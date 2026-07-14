import { PASSWORD_RECOVERY_SESSION_COOKIE } from '@/constants';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getInitialDisplayName } from '@/services';
import { redirectResponse } from '@/services/request';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';

const normalizeUserName = (value: string) => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  return (normalized.length >= 3 ? normalized : `user_${normalized}`).slice(0, 28);
};

const createProfile = async ({
  id,
  email,
  desiredUserName,
  displayName,
  avatarUrl,
}: {
  id: string;
  email: string;
  desiredUserName: string;
  displayName: string;
  avatarUrl: string | null;
}) => {
  const base = normalizeUserName(desiredUserName || email.split('@')[0] || 'user');

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const tail = suffix === 0 ? '' : `_${suffix}`;
    const userName = `${base.slice(0, 28 - tail.length)}${tail}`;
    try {
      return await prisma.users.create({
        data: { id, email, userName, displayName, avatarUrl },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
      throw error;
    }
  }

  throw new Error('Unable to reserve a username.');
};

export const GET = async (request: Request) => {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedPath = searchParams.get('next') ?? '/';
  const nextPath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';

  if (!code) return redirectResponse('/auth/sign-in?error=oauth', origin);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) return redirectResponse('/auth/sign-in?error=oauth', origin);
  if (nextPath === '/auth/update-password') {
    const response = NextResponse.redirect(new URL(nextPath, origin));
    response.cookies.set(PASSWORD_RECOVERY_SESSION_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60,
      path: '/',
    });
    return response;
  }

  const profile = await prisma.users.findUnique({ where: { id: data.user.id } });
  const displayName = profile?.displayName ?? (await getInitialDisplayName());
  const initialAvatarUrl = typeof data.user.user_metadata.avatar_url === 'string'
    ? data.user.user_metadata.avatar_url
    : null;
  try {
    if (profile) {
      await prisma.users.update({
        where: { id: data.user.id },
        data: {
          email: data.user.email,
          displayName,
          ...(!profile.avatarUrl && initialAvatarUrl ? { avatarUrl: initialAvatarUrl } : {}),
        },
      });
    } else {
      const desiredUserName = typeof data.user.user_metadata.userName === 'string'
        ? data.user.user_metadata.userName
        : data.user.email.split('@')[0];
      await createProfile({
        id: data.user.id,
        email: data.user.email,
        desiredUserName,
        displayName,
        avatarUrl: initialAvatarUrl,
      });
    }
  } catch {
    return redirectResponse('/auth/sign-in?error=oauth', origin);
  }

  return redirectResponse(nextPath, origin);
};
