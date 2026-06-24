import { cache } from "react";
import { User } from "./types";
import { createSupabaseServerClient } from "./supabase/server";

export const getCurrentUserID = cache(async (): Promise<string | undefined> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
});

export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const displayName =
    (typeof user.user_metadata.display_name === 'string' && user.user_metadata.display_name) ||
    (typeof user.user_metadata.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata.name === 'string' && user.user_metadata.name) ||
    user.email?.split('@')[0] ||
    'user';
  const image = typeof user.user_metadata.avatar_url === 'string' ? user.user_metadata.avatar_url : undefined;
  const username =
    (typeof user.user_metadata.username === 'string' && user.user_metadata.username) ||
    user.email?.split('@')[0] ||
    'user';

  return {
    id: user.id,
    username,
    email: user.email ?? '',
    displayName,
    bio: null,
    avatarUrl: image ?? null,
    coverUrl: null,
    createdAt: new Date(user.created_at),
  };
});
