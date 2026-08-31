import { useCallback, useEffect, useRef, useState } from "react";
import type { CurrentAuthUser } from "@/api/user.api";
import { closeBrowser } from "@/utils/nativeBrowser";
import { useSupabase } from "@/utils/supabase";
import { useUserData } from "./useUserData";
import {
  ACCOUNT_DELETION_REQUESTED_EVENT,
  advanceAccountDeletion,
  clearStoredDeletionRequest,
  isAccountDeletionRequestNotFound,
  isAccountDeletionUnauthorized,
  loadAccountDeletionContext,
  storeDeletionRequest,
  storedDeletionRequest,
} from "@/lib/accountDeletion";
import { cancelAllAccountNotifications } from "@/lib/notifications";
import i18n from "@/i18n";
import { toast } from "sonner";
import { reportError } from "@/utils/reportError";

export type AuthBootstrapState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "deleting"; requestId: string; retryAfterSeconds: number; retrying: boolean }
  | { status: "error"; stage: "profile" | "household" };

export function useAuthBootstrap() {
  const { supabase } = useSupabase();
  const { fetchUserData } = useUserData();
  const [state, setState] = useState<AuthBootstrapState>({ status: "loading" });
  const generation = useRef(0);
  const deletionAttempt = useRef(0);
  const loadedUserId = useRef<string | null>(null);
  const currentAuthUser = useRef<CurrentAuthUser | null>(null);

  const enterDeletionFlow = useCallback(
    async (
      authUser: CurrentAuthUser,
      requestId: string,
      retryAfterSeconds: number,
      isCurrent: () => boolean
    ) => {
      storeDeletionRequest(authUser.id, requestId);
      loadedUserId.current = authUser.id;
      await fetchUserData(null, isCurrent, { resetAnalyticsIdentity: true });
      if (!isCurrent()) return;
      await cancelAllAccountNotifications().catch((error) =>
        reportError("Failed to cancel account notifications", error)
      );
      if (isCurrent()) {
        setState({ status: "deleting", requestId, retryAfterSeconds, retrying: false });
      }
    },
    [fetchUserData]
  );

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

      if (authUser && (blocksNavigation || storedDeletionRequest(authUser.id))) {
        const stored = storedDeletionRequest(authUser.id);
        try {
          const deletion = await loadAccountDeletionContext(supabase);
          if (!isCurrent()) return false;
          if (deletion.requestId && deletion.status) {
            await enterDeletionFlow(
              authUser,
              deletion.requestId,
              deletion.retryAfterSeconds,
              isCurrent
            );
            return isCurrent();
          }
          if (stored) clearStoredDeletionRequest();
        } catch (error) {
          // A committed request may already have removed the profile/Auth user.
          // A locally persisted request is sufficient to enter recovery and let
          // the authenticated Edge Function decide whether erasure completed.
          if (stored && isCurrent()) {
            console.info("Resuming account deletion from its local receipt", error);
            await enterDeletionFlow(authUser, stored.requestId, 1, isCurrent);
            return isCurrent();
          }
        }
      }

      // `isIdentityChange` is the only signal that separates a real sign-out
      // (a known user becoming null) from a visitor who was never signed in.
      // Supabase emits a null session to every new `onAuthStateChange`
      // subscriber, so without this gate PostHog's identity resets constantly.
      const result = await fetchUserData(authUser, isCurrent, {
        resetAnalyticsIdentity: isIdentityChange,
      });
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
    [enterDeletionFlow, fetchUserData, supabase]
  );

  const finishLocalDeletion = useCallback(async () => {
    const finishGeneration = ++generation.current;
    const isCurrent = () => generation.current === finishGeneration;
    await fetchUserData(null, isCurrent, { resetAnalyticsIdentity: true });
    await cancelAllAccountNotifications().catch((error) =>
      reportError("Failed to cancel account notifications", error)
    );
    clearStoredDeletionRequest();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) reportError("Failed to clear the deleted account session", error);
    if (isCurrent()) {
      loadedUserId.current = null;
      currentAuthUser.current = null;
      setState({ status: "ready" });
    }
    toast.success(i18n.t("settings.confirmations.deleteAccount.completed"));
  }, [fetchUserData, supabase]);

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

        void closeBrowser().catch((error) =>
          reportError("Failed to close the in-app browser", error)
        );
      });

    const resumeDeletion = () => {
      if (currentAuthUser.current) {
        void bootstrapUser(currentAuthUser.current, true);
      }
    };
    window.addEventListener(ACCOUNT_DELETION_REQUESTED_EVENT, resumeDeletion);

    return () => {
      cancelled = true;
      generation.current += 1;
      deletionAttempt.current += 1;
      pendingTimers.forEach((timer) => globalThis.clearTimeout(timer));
      subscription?.unsubscribe();
      window.removeEventListener(ACCOUNT_DELETION_REQUESTED_EVENT, resumeDeletion);
    };
  }, [bootstrapUser, supabase]);

  useEffect(() => {
    if (state.status !== "deleting") return;
    const requestId = state.requestId;
    const attempt = ++deletionAttempt.current;
    const timer = globalThis.setTimeout(
      () => {
        void (async () => {
          try {
            const status = await advanceAccountDeletion(supabase, requestId);
            if (deletionAttempt.current !== attempt) return;
            if (status.status === "completed") {
              await finishLocalDeletion();
              return;
            }
            setState({
              status: "deleting",
              requestId,
              retryAfterSeconds: status.retryAfterSeconds,
              retrying: false,
            });
          } catch (error) {
            if (deletionAttempt.current !== attempt) return;
            if (isAccountDeletionUnauthorized(error)) {
              // Auth is the final backend deletion step. Once the durable local
              // receipt exists, a missing Auth user/session means completion.
              await finishLocalDeletion();
              return;
            }
            if (isAccountDeletionRequestNotFound(error)) {
              // A request ID is persisted before the destructive call. If that
              // call never reached the server, discard only the orphaned local
              // receipt and re-run the authoritative account preflight.
              clearStoredDeletionRequest();
              await bootstrapUser(currentAuthUser.current, true);
              return;
            }
            reportError("Account deletion status check failed", error);
            setState({
              status: "deleting",
              requestId,
              retryAfterSeconds: 15,
              retrying: true,
            });
          }
        })();
      },
      Math.max(1, state.retryAfterSeconds) * 1_000
    );
    return () => {
      globalThis.clearTimeout(timer);
      if (deletionAttempt.current === attempt) deletionAttempt.current += 1;
    };
  }, [bootstrapUser, finishLocalDeletion, state, supabase]);

  const retry = useCallback(() => {
    if (state.status === "deleting") {
      setState({ ...state, retryAfterSeconds: 1, retrying: false });
      return;
    }
    void bootstrapUser(currentAuthUser.current, true);
  }, [bootstrapUser, state]);

  return {
    state,
    retry,
    refreshUser: bootstrapUser,
  };
}
