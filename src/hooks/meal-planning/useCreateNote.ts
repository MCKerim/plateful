import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { toPlannedDateString } from "@/lib/dateHelper/dateHelper";

export type CreateNoteVariables = {
  householdId: string;
  /**
   * Minted by the caller when the draft starts and kept until it saved: a
   * retry after a lost response then lands on the same note instead of a
   * second one (the RPC is idempotent per id).
   */
  noteId: string;
  entryId: string;
  text: string;
  plannedDate: Date | null;
};

/** Creates a note with its first placement (a day, or the pool). */
export function useCreateNote() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: CreateNoteVariables) => {
      await mealPlanningApi.createNote(supabase, {
        householdId: variables.householdId,
        noteId: variables.noteId,
        entryId: variables.entryId,
        text: variables.text,
        plannedDate: variables.plannedDate ? toPlannedDateString(variables.plannedDate) : null,
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all });
    },
  });
}
