const LAST_OPENED_KEY = "cooking.lastOpenedRecipeId";

/** The recipe the cooking screen showed last, so the pill returns there; a per-device convenience. */
export function rememberOpenedCooking(recipeId: string) {
  try {
    localStorage.setItem(LAST_OPENED_KEY, recipeId);
  } catch {
    // Storage may be unavailable; the pill then shows the newest session.
  }
}

export function lastOpenedRecipeId(): string | null {
  try {
    return localStorage.getItem(LAST_OPENED_KEY);
  } catch {
    return null;
  }
}
