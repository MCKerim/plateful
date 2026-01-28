export const TOOLS = [
  {
    type: "function",
    name: "propose_recipe",
    description: "Propose the user a new or edited recipe. It will show the user UI to save the recipe. Can be used multiple times in one conversation.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Recipe title"
        },
        description: {
          type: "string",
          description: "Recipe ingredients, serving size and instructions formatted with markdown"
        },
        category: {
          type: "string",
          description: "Category for the recipe",
          enum: [
            "Breakfast",
            "Main Course",
            "Dessert",
            "Drinks",
            "Other"
          ]
        }
      },
      required: [
        "title",
        "description",
        "category"
      ],
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "propose_recipe_edit",
    description: "Propose edits to an existing recipe. IMPORTANT: Only include fields you want to change. Do NOT include fields that should remain unchanged - omit them entirely. The user must approve changes before they are saved.",
    strict: false,
    parameters: {
      type: "object",
      properties: {
        recipeId: {
          type: "number",
          description: "The ID of the recipe being edited (required)"
        },
        title: {
          type: "string",
          description: "New title for the recipe. OMIT this field if the title should stay the same."
        },
        category: {
          type: "string",
          enum: ["Breakfast", "Main Course", "Dessert", "Drinks", "Other"],
          description: "New category for the recipe. OMIT this field if the category should stay the same."
        },
        description: {
          type: "string",
          description: "New description/content in markdown format. OMIT this field if the description should stay the same."
        }
      },
      required: ["recipeId"],
      additionalProperties: false
    }
  }
];
export function proposeRecipe(title, description, category) {
  const toolOutputForUI = {
    status: "success",
    tool: "propose_recipe",
    args: {
      title: title,
      description: description,
      category: category
    }
  };
  return toolOutputForUI;
}

export function proposeRecipeEdit(recipeId, title, description, category) {
  const toolOutputForUI = {
    status: "success",
    toolName: "propose_recipe_edit",
    args: {
      recipeId: recipeId,
      // Only include fields that were provided (not undefined)
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category })
    }
  };
  return toolOutputForUI;
}
