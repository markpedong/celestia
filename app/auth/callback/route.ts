import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getInitialDisplayName } from '@/lib/initial-display-name';
import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedPath = searchParams.get('next') ?? '/';
  const nextPath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      const fallbackDisplayName = data.user.email.split('@')[0];
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', data.user.id)
        .maybeSingle();
      const shouldGenerateDisplayName = !existingProfile?.display_name || existingProfile.display_name === fallbackDisplayName;
      const { error: profileError } = await supabase.from('user_profiles').upsert({
        id: data.user.id,
        username: data.user.email.split('@')[0],
        email: data.user.email,
        ...(shouldGenerateDisplayName ? { display_name: await getInitialDisplayName(fallbackDisplayName) } : {}),
        avatar_url: data.user.user_metadata.avatar_url ?? null,
      });

      if (!profileError) return NextResponse.redirect(new URL(nextPath, origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/sign-in?error=oauth', origin));
};
