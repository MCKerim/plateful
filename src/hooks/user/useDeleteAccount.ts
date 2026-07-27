import { useMutation, useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import {
  announceAccountDeletionRequest,
  loadAccountDeletionContext,
  requestAccountDeletion,
  storeDeletionRequest,
  storedDeletionRequest,
} from "@/lib/accountDeletion";

export function useDeleteAccount(enabled: boolean) {
  const { supabase } = useSupabase();

  const contextQuery = useQuery({
    queryKey: ["account-deletion", "context"],
    queryFn: () => loadAccountDeletionContext(supabase),
    enabled,
    staleTime: 0,
    retry: 1,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async ({ successorUserId }: { successorUserId: string | null }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("unauthorized");

      const requestId = storedDeletionRequest(user.id)?.requestId ?? crypto.randomUUID();
      // Persist before the destructive request. If the response is lost after
      // the database commit, bootstrap resumes this exact idempotent request.
      storeDeletionRequest(user.id, requestId);
      const status = await requestAccountDeletion(supabase, requestId, successorUserId);
      announceAccountDeletionRequest();
      return status;
    },
  });

  return { contextQuery, deleteAccountMutation };
}
