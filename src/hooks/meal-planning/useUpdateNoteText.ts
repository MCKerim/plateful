import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { MealPlannerItem } from "@/types/meal-planning.types";

/**
 * Changes a note's text on every copy at once: optimistically in every cached
 * week, then on the server. A failure rolls the weeks back.
 */
export function useUpdateNoteText() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, text }: { noteId: string; text: string }) => {
      await mealPlanningApi.updateNoteText(supabase, noteId, text);
    },
    onMutate: async ({ noteId, text }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mealPlanning.lists });

      const previousData = queryClient.getQueriesData<MealPlannerItem[]>({
        queryKey: queryKeys.mealPlanning.lists,
      });

      queryClient.setQueriesData<MealPlannerItem[]>(
        { queryKey: queryKeys.mealPlanning.lists },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((item) =>
            item.kind === "note" && item.noteId === noteId ? { ...item, text } : item
          );
        }
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all });
    },
  });
}
