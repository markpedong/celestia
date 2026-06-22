import type { Session } from "@supabase/supabase-js";

export const getUserNameByAuth = (user?: Session['user']) => user?.email?.split('@')[0] ?? '';