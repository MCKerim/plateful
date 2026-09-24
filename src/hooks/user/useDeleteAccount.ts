import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSupabase } from "@/utils/supabase";
import { loadAccountDeletionContext, requestAccountDeletion } from "@/lib/accountDeletion";
import { cancelAllAccountNotifications } from "@/lib/notifications";
import { randomId } from "@/utils/randomId";
import { reportError } from "@/utils/reportError";

export function useDeleteAccount(enabled: boolean) {
  const { supabase } = useSupabase();
  const { t } = useTranslation();

  const contextQuery = useQuery({
    queryKey: ["account-deletion", "context"],
    queryFn: () => loadAccountDeletionContext(supabase),
    enabled,
    staleTime: 0,
    retry: 1,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async ({ successorUserId }: { successorUserId: string | null }) => {
      // The server deletes the Auth user inside this request: any 2xx means
      // the account is gone and this session is dead. Nothing is polled and
      // nothing is persisted, so a fresh idempotency id per attempt is enough.
      await requestAccountDeletion(supabase, randomId(), successorUserId);

      // Local state only. The request already removed the server-side rows,
      // including the push tokens.
      await cancelAllAccountNotifications().catch((error) =>
        reportError("Failed to cancel account notifications", error)
      );

      // A local sign-out: there is no user left whose token could be revoked.
      // The SIGNED_OUT event runs the normal sign-out path in the auth
      // bootstrap (Redux, React Query, PostHog reset, RevenueCat logout) and
      // routing lands on the welcome screen.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) reportError("Failed to clear the deleted account session", error);
    },
    // Hook-level on purpose: the sign-out unmounts the Settings page, and the
    // callbacks passed to `mutate()` are skipped once their component is gone.
    onSuccess: () => {
      toast.success(t("settings.confirmations.deleteAccount.completed"));
    },
  });

  return { contextQuery, deleteAccountMutation };
}
