import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedPath = searchParams.get('next') ?? '/';
  const nextPath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return NextResponse.redirect(new URL(nextPath, origin));
  }

  return NextResponse.redirect(new URL('/auth/sign-in?error=oauth', origin));
};
