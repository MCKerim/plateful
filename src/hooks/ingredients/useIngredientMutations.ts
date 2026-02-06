import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { ingredientsApi } from "@/api/ingredients.api";
import type { RecipeIngredientInput } from "@/types/ingredient.types";

export function useCreateIngredient() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      input,
      sortOrder,
    }: {
      recipeId: string;
      input: RecipeIngredientInput;
      sortOrder?: number;
    }) => {
      return ingredientsApi.create(supabase, recipeId, input, sortOrder);
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.ingredients(variables.recipeId),
      });
    },
  });
}

export function useCreateIngredientsBulk() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      inputs,
    }: {
      recipeId: string;
      inputs: RecipeIngredientInput[];
    }) => {
      return ingredientsApi.createBulk(supabase, recipeId, inputs);
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.ingredients(variables.recipeId),
      });
    },
  });
}

export function useUpdateIngredient() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ingredientId,
      input,
    }: {
      ingredientId: string;
      recipeId: string;
      input: Partial<RecipeIngredientInput>;
    }) => {
      return ingredientsApi.update(supabase, ingredientId, input);
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.ingredients(variables.recipeId),
      });
    },
  });
}

export function useDeleteIngredient() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ingredientId,
    }: {
      ingredientId: string;
      recipeId: string;
    }) => {
      return ingredientsApi.delete(supabase, ingredientId);
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.ingredients(variables.recipeId),
      });
    },
  });
}

export function useReorderIngredients() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderedIds,
    }: {
      orderedIds: string[];
      recipeId: string;
    }) => {
      return ingredientsApi.reorder(supabase, orderedIds);
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.ingredients(variables.recipeId),
      });
    },
  });
}

export function useReplaceAllIngredients() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      inputs,
    }: {
      recipeId: string;
      inputs: RecipeIngredientInput[];
    }) => {
      return ingredientsApi.replaceAll(supabase, recipeId, inputs);
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.ingredients(variables.recipeId),
      });
    },
  });
}
