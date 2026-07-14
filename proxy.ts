import { PASSWORD_RECOVERY_SESSION_COOKIE } from '@/constants';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const proxy = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const fetchSite = request.headers.get('sec-fetch-site');
    if (fetchSite === 'cross-site') {
      return NextResponse.json({ success: false, data: null, message: 'Cross-site request blocked.' }, { status: 403 });
    }

    const origin = request.headers.get('origin');
    const expectedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ?? request.headers.get('host');
    if (origin && expectedHost && (!URL.canParse(origin) || new URL(origin).host !== expectedHost)) {
      return NextResponse.json({ success: false, data: null, message: 'Invalid request origin.' }, { status: 403 });
    }
  }
  const isAuthEntryPage = pathname === '/auth/sign-in' || pathname === '/auth/sign-up';
  const isPasswordRecoverySession = request.cookies.has(PASSWORD_RECOVERY_SESSION_COOKIE);
  let response = NextResponse.next({ request });
  const redirectWithCookies = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  };
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (isPasswordRecoverySession) response.cookies.delete(PASSWORD_RECOVERY_SESSION_COOKIE);
    return response;
  }

  if (isPasswordRecoverySession && pathname !== '/auth/update-password') {
    await supabase.auth.signOut();
    response = redirectWithCookies('/auth/sign-in');
    response.cookies.delete(PASSWORD_RECOVERY_SESSION_COOKIE);
    return response;
  }

  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!assurance.error && assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') {
    return response;
  }

  if (!isAuthEntryPage) return response;

  return redirectWithCookies('/');
};

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|images/.*).*)'],
};
