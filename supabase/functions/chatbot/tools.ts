export const TOOLS = [
  {
    type: "function",
    name: "propose_recipe",
    description:
      "Propose the user a new or edited recipe. It will show the user UI to save the recipe. Can be used multiple times in one conversation.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short concise dish name, max ~50 characters",
        },
        description: {
          type: "string",
          description: "Short 1-2 sentence summary of the dish.",
        },
        servings: {
          type: "number",
          description: "Number of servings this recipe makes.",
        },
        ingredients: {
          type: "string",
          description:
            "Markdown list of ingredients. Use `- item` for each ingredient. Use `### Section` headings to group ingredients (e.g. ### Sauce). Do not include a top-level heading.",
        },
        instructions: {
          type: "string",
          description:
            "Numbered steps in markdown (1. step). Do not include a top-level heading.",
        },
        category: {
          type: "string",
          description: "Category for the recipe",
          enum: ["Breakfast", "Main Course", "Dessert", "Drinks", "Other"],
        },
      },
      required: ["title", "description", "servings", "ingredients", "instructions", "category"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "propose_recipe_edit",
    description:
      "Propose edits to an existing recipe. IMPORTANT: Only include fields you want to change. Do NOT include fields that should remain unchanged - omit them entirely. The user must approve changes before they are saved.",
    strict: false,
    parameters: {
      type: "object",
      properties: {
        recipeId: {
          type: "number",
          description: "The ID of the recipe being edited (required)",
        },
        title: {
          type: "string",
          description:
            "New title for the recipe. OMIT this field if the title should stay the same.",
        },
        description: {
          type: "string",
          description:
            "New short 1-2 sentence summary. OMIT this field if the description should stay the same.",
        },
        servings: {
          type: "number",
          description:
            "New serving count. OMIT this field if servings should stay the same.",
        },
        ingredients: {
          type: "string",
          description:
            "New full ingredient list in markdown (- item, ### Section for groups). OMIT if ingredients should stay the same. If provided, must include ALL ingredients (replaces existing).",
        },
        instructions: {
          type: "string",
          description:
            "New instructions as numbered steps. OMIT if instructions should stay the same.",
        },
        category: {
          type: "string",
          enum: ["Breakfast", "Main Course", "Dessert", "Drinks", "Other"],
          description:
            "New category for the recipe. OMIT this field if the category should stay the same.",
        },
      },
      required: ["recipeId"],
      additionalProperties: false,
    },
  },
];

export function proposeRecipe(
  proposalId: string,
  title,
  description,
  servings,
  ingredients,
  instructions,
  category
) {
  const toolOutputForUI = {
    status: `Recipe proposal ${proposalId} shown to user.`,
    proposalId,
    toolName: "propose_recipe",
    args: {
      title,
      description,
      servings,
      ingredients,
      instructions,
      category,
    },
  };
  return toolOutputForUI;
}

export function proposeRecipeEdit(
  proposalId: string,
  recipeId,
  title,
  description,
  servings,
  ingredients,
  instructions,
  category
) {
  const toolOutputForUI = {
    status: `Edit proposal ${proposalId} shown to user.`,
    proposalId,
    toolName: "propose_recipe_edit",
    args: {
      recipeId,
      // Only include fields that were provided (not undefined)
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(servings !== undefined && { servings }),
      ...(ingredients !== undefined && { ingredients }),
      ...(instructions !== undefined && { instructions }),
      ...(category !== undefined && { category }),
    },
  };
  return toolOutputForUI;
}
