import { useCallback, useEffect, useRef, useState } from "react";
import type { CurrentAuthUser } from "@/api/user.api";
import { closeBrowser } from "@/utils/nativeBrowser";
import { useSupabase } from "@/utils/supabase";
import { useUserData } from "./useUserData";

export type AuthBootstrapState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; stage: "profile" | "household" };

export function useAuthBootstrap() {
  const { supabase } = useSupabase();
  const { fetchUserData } = useUserData();
  const [state, setState] = useState<AuthBootstrapState>({ status: "loading" });
  const generation = useRef(0);
  const loadedUserId = useRef<string | null>(null);
  const currentAuthUser = useRef<CurrentAuthUser | null>(null);

  const bootstrapUser = useCallback(
    async (authUser: CurrentAuthUser | null, forceBlocking = false): Promise<boolean> => {
      currentAuthUser.current = authUser;
      const loadGeneration = ++generation.current;
      const isCurrent = () => generation.current === loadGeneration;
      const isIdentityChange = loadedUserId.current !== (authUser?.id ?? null);
      const blocksNavigation = forceBlocking || isIdentityChange;

      if (blocksNavigation) {
        setState({ status: "loading" });
      }

      const result = await fetchUserData(authUser, isCurrent);
      if (!isCurrent() || result.status === "superseded") {
        return false;
      }

      switch (result.status) {
        case "ready":
          loadedUserId.current = authUser?.id ?? null;
          setState({ status: "ready" });
          return true;
        case "signed_out":
          loadedUserId.current = null;
          setState({ status: "ready" });
          return true;
        case "failed":
          if (blocksNavigation) {
            setState({ status: "error", stage: result.stage });
          }
          return false;
      }
    },
    [fetchUserData]
  );

  useEffect(() => {
    let cancelled = false;
    const pendingTimers = new Set<ReturnType<typeof globalThis.setTimeout>>();
    const { data: { subscription } = { subscription: undefined } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        // Supabase holds its auth lock while this callback runs. Keep the
        // callback synchronous and defer any client request until it returns.
        const timer = globalThis.setTimeout(() => {
          pendingTimers.delete(timer);
          if (!cancelled) {
            void bootstrapUser(session?.user ?? null);
          }
        }, 0);
        pendingTimers.add(timer);

        void closeBrowser().catch((error) => console.error(error));
      });

    return () => {
      cancelled = true;
      generation.current += 1;
      pendingTimers.forEach((timer) => globalThis.clearTimeout(timer));
      subscription?.unsubscribe();
    };
  }, [bootstrapUser, supabase]);

  const retry = useCallback(() => {
    void bootstrapUser(currentAuthUser.current, true);
  }, [bootstrapUser]);

  return {
    state,
    retry,
    refreshUser: bootstrapUser,
  };
}
