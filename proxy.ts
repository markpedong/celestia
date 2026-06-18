import { NextResponse, type NextRequest } from 'next/server';

const NEON_AUTH_SESSION_COOKIE_NAME = '__Secure-neon-auth.session_token';

export const proxy = (request: NextRequest) => {
  const hasSession = request.cookies.has(NEON_AUTH_SESSION_COOKIE_NAME);

  if (hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ['/auth/sign-in', '/auth/sign-up'],
};
