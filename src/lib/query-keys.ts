export const queryKeys = {
  mealPlanning: {
    all: ["meal-planning"] as const,
    list: (weekStart: string) => ["meal-planning", "list", weekStart] as const,
    summary: (weekStart: string) =>
      ["meal-planning", "summary", weekStart] as const,
    info: (recipeId: number) => ["meal-planning", "info", recipeId] as const,
  },
  recipes: {
    all: ["recipes"] as const,
    detail: (id: number) => ["recipes", id] as const,
    items: (id: number) => ["recipes", id, "items"] as const,
    images: (id: number) => ["recipes", id, "images"] as const,
  },
  ratings: {
    all: ["ratings"] as const,
    byRecipe: (recipeId: number) => ["ratings", "recipe", recipeId] as const,
  },
} as const;
