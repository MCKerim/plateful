import { SupabaseClient } from "@supabase/supabase-js";
import {
  MealPlannerItemRaw,
  MealType,
  PlacementEntryRaw,
  PlannedItemSummaryRaw,
  PlanSubject,
  RecipeMealPlanInfo,
  RecipePlacementRow,
} from "@/types/meal-planning.types";
import { toPlannedDateString } from "@/lib/dateHelper/dateHelper";
import { recipeMealPlanInfo } from "@/lib/mealPlanHelper/mealPlanHelper";

export type CreateNoteParams = {
  householdId: string;
  /** Client-minted; the RPC is idempotent per id, so a retry cannot create a second note. */
  noteId: string;
  entryId: string;
  text: string;
  /** A local `yyyy-MM-dd`, or `null` for the pool. */
  plannedDate: string | null;
};

/** One new placement for `apply_planner_changes`: a client-minted id, a local day (`null` for a pool copy) and its meal type. */
export type PlacementInsertion = {
  id: string;
  planned_date: string | null;
  meal_type: MealType;
};

export type ApplyPlannerChangesParams = {
  householdId: string;
  subject: PlanSubject;
  insertions: PlacementInsertion[];
  deleteIds: string[];
};

// `planned_date` is a Postgres `date`. Every value sent here is a local
// `yyyy-MM-dd` (see `toPlannedDateString`); an ISO timestamp would be cast in
// UTC and land on the previous day between local midnight and 02:00.
export const mealPlanningApi = {
  async getItemsForWeek(
    supabase: SupabaseClient,
    weekStart: Date,
    weekEnd: Date
  ): Promise<MealPlannerItemRaw[]> {
    const from = toPlannedDateString(weekStart);
    const to = toPlannedDateString(weekEnd);
    const { data, error } = await supabase
      .from("meal_planning")
      .select(
        `
        id,
        planned_date,
        eaten,
        meal_type,
        recipes (id, name, tags),
        planner_notes (id, text)
      `
      )
      .or(`planned_date.is.null,and(planned_date.gte.${from},planned_date.lte.${to})`)
      .order("created_at", { ascending: true })
      .returns<MealPlannerItemRaw[]>();

    if (error) throw error;
    return data ?? [];
  },

  async getSummaryForWeek(
    supabase: SupabaseClient,
    weekStart: Date,
    weekEnd: Date
  ): Promise<PlannedItemSummaryRaw[]> {
    const { data, error } = await supabase
      .from("meal_planning")
      .select(`planned_date, recipes (name), planner_notes (text)`)
      .gte("planned_date", toPlannedDateString(weekStart))
      .lte("planned_date", toPlannedDateString(weekEnd))
      .order("planned_date", { ascending: true })
      .returns<PlannedItemSummaryRaw[]>();

    if (error) throw error;
    return data ?? [];
  },

  async updateDate(
    supabase: SupabaseClient,
    id: string,
    plannedDate: string | null
  ): Promise<void> {
    const { error } = await supabase
      .from("meal_planning")
      .update({ planned_date: plannedDate })
      .eq("id", id);

    if (error) throw error;
  },

  async setEaten(supabase: SupabaseClient, id: string, eaten: boolean): Promise<void> {
    const { error } = await supabase.from("meal_planning").update({ eaten }).eq("id", id);

    if (error) throw error;
  },

  async setMealType(supabase: SupabaseClient, id: string, mealType: MealType): Promise<void> {
    const { error } = await supabase
      .from("meal_planning")
      .update({ meal_type: mealType })
      .eq("id", id);

    if (error) throw error;
  },

  /** Removes one placement of either kind. A note's last placement takes the note's text with it (server trigger). */
  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from("meal_planning").delete().eq("id", id);

    if (error) throw error;
  },

  /** A note and its first placement, in one transaction on the server. */
  async createNote(supabase: SupabaseClient, params: CreateNoteParams): Promise<void> {
    const { error } = await supabase.rpc("create_planner_note", {
      p_household_id: params.householdId,
      p_note_id: params.noteId,
      p_entry_id: params.entryId,
      p_text: params.text,
      p_planned_date: params.plannedDate,
    });

    if (error) throw error;
  },

  /**
   * The household's own note texts for the note dialog's chips, most planned
   * first (see `planner_note_suggestions`); empty for a fresh household.
   */
  async getNoteSuggestions(supabase: SupabaseClient, householdId: string): Promise<string[]> {
    const { data, error } = await supabase.rpc("planner_note_suggestions", {
      p_household_id: householdId,
    });

    if (error) throw error;
    return ((data ?? []) as { suggestion: string }[]).map((row) => row.suggestion);
  },

  /**
   * Changes the text every copy of the note shows. No row back means a
   * household member removed the note meanwhile; that is an error, never a
   * reason to recreate it.
   */
  async updateNoteText(supabase: SupabaseClient, noteId: string, text: string): Promise<void> {
    const { data, error } = await supabase
      .from("planner_notes")
      .update({ text })
      .eq("id", noteId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("The note no longer exists");
  },

  /**
   * The weekly plan dialog's save as one transaction: the new placements and
   * the removed ones together, for a recipe or a note. Only the ids given are
   * deleted, so a day a household member added meanwhile survives.
   */
  async applyPlannerChanges(
    supabase: SupabaseClient,
    params: ApplyPlannerChangesParams
  ): Promise<void> {
    const { error } = await supabase.rpc("apply_planner_changes", {
      p_household_id: params.householdId,
      p_insertions: params.insertions,
      p_delete_ids: params.deleteIds,
      p_recipe_id: params.subject.kind === "recipe" ? params.subject.id : null,
      p_note_id: params.subject.kind === "note" ? params.subject.noteId : null,
    });

    if (error) throw error;
  },

  /** The subject's dated placements in a week, for the weekly plan dialog. */
  async getPlacementsInWeek(
    supabase: SupabaseClient,
    subject: PlanSubject,
    weekStart: Date,
    weekEnd: Date
  ): Promise<PlacementEntryRaw[]> {
    const query = supabase
      .from("meal_planning")
      .select("id, planned_date")
      .gte("planned_date", toPlannedDateString(weekStart))
      .lte("planned_date", toPlannedDateString(weekEnd))
      .order("planned_date", { ascending: true });
    const scoped =
      subject.kind === "recipe"
        ? query.eq("recipe_id", subject.id)
        : query.eq("note_id", subject.noteId);
    const { data, error } = await scoped.returns<PlacementEntryRaw[]>();

    if (error) throw error;
    return data ?? [];
  },

  /**
   * The stored meal type of the subject's newest placement that has one, the
   * last choice the weekly plan dialog preselects; `null` when none has.
   * Newest by `created_at`, not `updated_at`: a move or a cooked check bumps
   * that. `updated_at` only breaks the tie between copies one save inserted
   * together, so a type changed on one of them wins. RLS scopes the rows to
   * the household.
   */
  async getLastMealType(supabase: SupabaseClient, subject: PlanSubject): Promise<string | null> {
    const query = supabase
      .from("meal_planning")
      .select("meal_type")
      .not("meal_type", "is", null)
      .order("created_at", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1);
    const scoped =
      subject.kind === "recipe"
        ? query.eq("recipe_id", subject.id)
        : query.eq("note_id", subject.noteId);
    const { data, error } = await scoped;

    if (error) throw error;
    return data?.[0]?.meal_type ?? null;
  },

  /**
   * Every recipe placement the household ever made, for the cookbook's
   * "not planned in a while" sort. RLS scopes the rows to the household.
   */
  async getAllRecipePlacements(supabase: SupabaseClient): Promise<RecipePlacementRow[]> {
    const { data, error } = await supabase
      .from("meal_planning")
      .select("recipe_id, planned_date, eaten")
      .not("recipe_id", "is", null);
    if (error) throw error;
    return (data ?? []) as RecipePlacementRow[];
  },

  /**
   * One recipe's plan status, for the recipe page. The cookbook does not call
   * this per card: it reads `getAllRecipePlacements` once and derives every
   * card's status with `recipeMealPlanInfos`.
   */
  async getInfoByRecipe(supabase: SupabaseClient, recipeId: string): Promise<RecipeMealPlanInfo> {
    const { data, error } = await supabase
      .from("meal_planning")
      .select("recipe_id, planned_date, eaten")
      .eq("recipe_id", recipeId);

    if (error) throw error;
    return recipeMealPlanInfo(
      (data ?? []) as RecipePlacementRow[],
      toPlannedDateString(new Date())
    );
  },
};
