"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

// Track the signed-in user for client components. Starts as a session fetch
// and then stays in sync via onAuthStateChange (sign in / sign out / refresh).
export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  // Without Supabase env vars there is no session to load; resolve immediately
  // via the lazy initializer so the effect below never needs a synchronous
  // setState (which react-hooks/set-state-in-effect flags).
  const [loading, setLoading] = useState(
    () => !process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    let active = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
