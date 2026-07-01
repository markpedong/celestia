"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createSupabaseBrowserClient();

export const useSession = () => {
  const [session, setSession] = useState<Session | null>();

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_, session) => {
        setSession(session);
      });

      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { session, user: session?.user, supabase };
};
