import { cache } from "react";
import { User } from "./types";
import { createSupabaseServerClient } from "./supabase/server";
import { prisma } from "./prisma";

export const getCurrentUserID = cache(async (): Promise<string | undefined> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
});

export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.users.findUnique({ where: { id: user.id } });
  const displayName =
    profile?.displayName ||
    (typeof user.user_metadata.display_name === 'string' && user.user_metadata.display_name) ||
    (typeof user.user_metadata.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata.name === 'string' && user.user_metadata.name) ||
    user.email?.split('@')[0] ||
    'user';
  const userName =
    profile?.userName ||
    (typeof user.user_metadata.userName === 'string' && user.user_metadata.userName) ||
    user.email?.split('@')[0] ||
    'user';

  return {
    id: user.id,
    userName,
    email: profile?.email ?? user.email ?? '',
    displayName,
    bio: profile?.bio ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    coverUrl: profile?.coverUrl ?? null,
    createdAt: profile?.createdAt ?? new Date(user.created_at),
  };
});
