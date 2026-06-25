import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getInitialDisplayName } from '@/services';
import { redirectResponse } from '@/services/request';

export const GET = async (request: Request) => {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedPath = searchParams.get('next') ?? '/';
  const nextPath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';

  if (!code) return redirectResponse('/auth/sign-in?error=oauth', origin);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) return redirectResponse('/auth/sign-in?error=oauth', origin);
  if (nextPath === '/auth/update-password') return redirectResponse(nextPath, origin);

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', data.user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? (await getInitialDisplayName());
  const initialAvatarUrl = typeof data.user.user_metadata.avatar_url === 'string'
    ? data.user.user_metadata.avatar_url
    : null;
  const { error: profileError } = profile
    ? await supabase
      .from('users')
      .update({ email: data.user.email, display_name: displayName })
      .eq('id', data.user.id)
    : await supabase
      .from('users')
      .insert({
        id: data.user.id,
        username: data.user.email.split('@')[0],
        email: data.user.email,
        display_name: displayName,
        avatar_url: initialAvatarUrl,
      });

  if (profileError) return redirectResponse('/auth/sign-in?error=oauth', origin);

  return redirectResponse(nextPath, origin);
};
