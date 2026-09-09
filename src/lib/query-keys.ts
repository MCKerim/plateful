export const queryKeys = {
  mealPlanning: {
    all: ["meal-planning"] as const,
    lists: ["meal-planning", "list"] as const,
    list: (weekStart: string) => ["meal-planning", "list", weekStart] as const,
    summary: (weekStart: string) => ["meal-planning", "summary", weekStart] as const,
    info: (recipeId: string) => ["meal-planning", "info", recipeId] as const,
    lastPlanned: ["meal-planning", "last-planned"] as const,
    placements: (subjectKey: string, weekStart: string) =>
      ["meal-planning", "placements", subjectKey, weekStart] as const,
    noteSuggestions: (householdId: string) =>
      ["meal-planning", "note-suggestions", householdId] as const,
  },
  recipes: {
    all: ["recipes"] as const,
    list: ["recipes", "list"] as const,
    detail: (id: string) => ["recipes", id] as const,
    items: (id: string) => ["recipes", id, "items"] as const,
    ingredients: (id: string) => ["recipes", id, "ingredients"] as const,
    instructions: (id: string) => ["recipes", id, "instructions"] as const,
    images: (id: string) => ["recipes", id, "images"] as const,
  },
  collections: {
    all: ["collections"] as const,
    list: (householdId: string) => ["collections", "list", householdId] as const,
    memberships: (recipeId: string) => ["collections", "memberships", recipeId] as const,
  },
  recipeImports: {
    all: ["recipe-imports"] as const,
    active: ["recipe-imports", "active"] as const,
  },
  ratings: {
    all: ["ratings"] as const,
    byRecipe: (recipeId: string) => ["ratings", "recipe", recipeId] as const,
  },
  sharedRecipes: {
    byToken: (token: string) => ["shared-recipes", token] as const,
  },
  subscription: {
    byHousehold: (householdId: string) => ["subscription", "household", householdId] as const,
  },
  missions: {
    householdMissions: (householdId: string) => ["missions", "household", householdId] as const,
    householdRewards: (householdId: string) => ["missions", "rewards", householdId] as const,
  },
} as const;
