"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@/lib/types";

const supabase = createSupabaseBrowserClient();

export type InitialSessionUser = Omit<User, 'createdAt'> & { createdAt: string };

const SessionContext = createContext<InitialSessionUser | null>(null);

export const SessionProvider = ({ initialUser, children }: { initialUser: InitialSessionUser | null; children: ReactNode }) =>
  createElement(SessionContext.Provider, { value: initialUser }, children);

export const useSession = () => {
  const initialUser = useContext(SessionContext);
  const [session, setSession] = useState<Session | null>();
  const fallbackUser = useMemo(
    () => initialUser ? ({ id: initialUser.id } as Session['user']) : undefined,
    [initialUser]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? (session === undefined ? fallbackUser : undefined), initialUser, supabase };
};
