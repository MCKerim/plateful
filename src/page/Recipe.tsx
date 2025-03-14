import DayPicker from "@/components/atoms/DayPicker";
import ShoppingItem from "@/components/atoms/ShoppingItem";
import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router";

type Recipe = {
  id: number;
  recipeName: string;
  description: string;
  link: string;
};

type RecipeItem = {
  id: number;
  itemName: string;
  amount: string;
};

export default function Recipe() {
  const params = useParams();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [dateToPlan, setDateToPlan] = useState<Date | undefined>();

  useEffect(() => {
    async function getRecipe() {
      if (!params.recipeId) return;
      const recipeId = parseInt(params.recipeId);

      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId);

      if (!data) {
        setRecipe(null);
        return;
      }

      setRecipe({
        id: data[0].id,
        recipeName: data[0].name,
        description: data[0].description ?? "",
        link: data[0].link ?? "",
      });
    }

    getRecipe();
  }, [params.recipeId]);

  useEffect(() => {
    async function getRecipeItems() {
      if (!recipe) return;

      const { data } = await supabase
        .from("recipe_items")
        .select(
          `
        id,
        recipe_id,
        amount,
        item ( id, name )
      `
        )
        .eq("recipe_id", recipe.id)
        .order("created_at", { ascending: false });

      const newRecipeItems: RecipeItem[] = [];

      if (!data) {
        setRecipeItems(newRecipeItems);
        return;
      }

      data.forEach((recipeItem) => {
        const newRecipeItem: RecipeItem = {
          id: recipeItem.item.id,
          itemName: recipeItem.item.name,
          amount: recipeItem.amount,
        };
        newRecipeItems.push(newRecipeItem);
      });
      console.log("Items: ", newRecipeItems);
      setRecipeItems(newRecipeItems);
    }

    getRecipeItems();
  }, [recipe]);

  async function addItemsToShoppingList() {
    console.log("Adding items to shopping list: ", recipeItems);
    const itemsToInsert = recipeItems.map((recipeItem) => ({
      shopping_list_id: 1,
      item_id: recipeItem.id,
      amount: recipeItem.amount,
      bought: false,
    }));

    const { error } = await supabase
      .from("shopping_list_items")
      .insert(itemsToInsert);

    if (error) {
      console.error("Error adding items to shopping list: ", error);
      alert("Error adding items to shopping list");
    } else {
      alert("Items added to shopping list");
    }
  }

  async function planRecipe() {
    if (!recipe || !dateToPlan) {
      return;
    }

    console.log(dateToPlan.toISOString());

    const { error } = await supabase
      .from("meal_planning")
      .insert({ recipe_id: recipe.id, planned_date: dateToPlan.toISOString() });

    if (error) {
      console.error("Error while planning recipe: ", error);
      alert("Error while planning recipe");
    } else {
      alert("Recipe planned!");
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold">{recipe?.recipeName}</h1>

      <AspectRatio ratio={16 / 9} className="bg-muted -z-10">
        <img
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="by Drew Beamer"
          className="h-full w-full rounded-md object-cover"
        />
      </AspectRatio>

      <p className="font-bold">{recipe?.description}</p>

      <NavLink
        to={recipe?.link ?? "/discover"}
        className={buttonVariants({ variant: "outline" }) + " w-full mt-2"}
      >
        To the recipe
      </NavLink>

      <h2 className="text-md font-bold mt-2">Ingredients</h2>

      {recipeItems.map((recipeItem, index) => (
        <ShoppingItem
          key={"item-" + index}
          id={recipeItem.id}
          name={recipeItem.itemName}
          amount={recipeItem.amount}
          bought={false}
          onClick={() => {}}
          onEdit={() => {}}
        />
      ))}

      <Button
        className="w-full"
        variant="secondary"
        onClick={addItemsToShoppingList}
      >
        Add items to shopping list
      </Button>

      <div className="flex gap-2 w-full mt-11">
        <Button className="w-full" variant="secondary">
          Save
        </Button>

        <div>
          <DayPicker date={dateToPlan} setDate={setDateToPlan} />

          <Button className="w-full" onClick={planRecipe}>
            Plan
          </Button>
        </div>
      </div>
    </Layout>
  );
}
