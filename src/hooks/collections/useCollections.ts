import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { collectionApi } from "@/api/collection.api";
import { queryKeys } from "@/lib/query-keys";
import { useSupabase } from "@/utils/supabase";

export function useCollections(householdId: string | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.collections.list(householdId ?? ""),
    queryFn: () => collectionApi.list(supabase, householdId!),
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecipeCollectionIds(recipeId: string | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.collections.memberships(recipeId ?? ""),
    queryFn: () => collectionApi.getRecipeMembershipIds(supabase, recipeId!),
    enabled: !!recipeId,
  });
}

export function useCreateCollection() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Parameters<typeof collectionApi.create>[1]) =>
      collectionApi.create(supabase, params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}

export function useUpdateCollection() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Parameters<typeof collectionApi.update>[1]) =>
      collectionApi.update(supabase, params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}

export function useDeleteCollection() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: string) => collectionApi.delete(supabase, collectionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.collections.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all }),
      ]);
    },
  });
}

export function useReplaceRecipeCollections() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, collectionIds }: { recipeId: string; collectionIds: string[] }) =>
      collectionApi.replaceRecipeMemberships(supabase, recipeId, collectionIds),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.memberships(variables.recipeId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all }),
      ]);
    },
  });
}
