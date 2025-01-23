import AddRecipeItemMenu from "@/components/atoms/AddRecipeItemMenu";
import ShoppingItem from "@/components/atoms/ShoppingItem";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import supabase from "@/utils/supabase";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

type RecipeItem = {
  itemName: string;
  amount: string;
};

export default function AddRecipe() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);

  const navigate = useNavigate();

  function addItem(name: string, amount: string) {
    console.log("Adding item: ", name, amount);
    setRecipeItems([...recipeItems, { itemName: name, amount }]);
  }

  function removeItem(index: number) {
    const newItems = [...recipeItems];
    newItems.splice(index, 1);
    setRecipeItems(newItems);
  }

  async function saveRecipe() {
    if (title === "" || description === "") {
      alert("Please fill in all fields.");
      return;
    }

    const { data, error } = await supabase
      .from("recipes")
      .insert([{ name: title, description, link }])
      .select();

    if (!error && data) {
      saveRecipeItems(data[0].id);
    } else {
      console.error(error);
      alert("An error occurred. Please try again.");
    }
  }

  async function saveItems() {
    const newItemsToInsert = recipeItems.map((item) => ({
      name: item.itemName,
    }));

    const { data, error } = await supabase
      .from("item")
      .insert(newItemsToInsert)
      .select();

    if (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
      return null;
    }
    return data;
  }

  async function saveRecipeItems(recipeId: number) {
    const newInsertedItems = await saveItems();

    if (!newInsertedItems) {
      return;
    }

    if (newInsertedItems) {
      const recipeItemsToInsert = newInsertedItems.map((item, index) => ({
        recipe_id: recipeId,
        item_id: item.id,
        amount: recipeItems[index].amount,
      }));

      const { error } = await supabase
        .from("recipe_items")
        .insert(recipeItemsToInsert)
        .select();

      if (error) {
        console.error(error);
        alert("An error occurred. Please try again.");
        return;
      } else {
        alert("Recipe saved successfully.");
        navigate("/discover");
      }
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-10">Add Recipe</h1>

      <div className="grid w-full items-center gap-5">
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            type="text"
            id="title"
            placeholder="Tomato soup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid w-full gap-2">
          <Label htmlFor="message">Description</Label>
          <Textarea
            placeholder="A beatiful and healthy dish."
            id="message"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid w-full items-center gap-2">
          <Label htmlFor="link">Link</Label>
          <Input
            type="text"
            id="link"
            placeholder="https://www.tomato-soup.com"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <div className="w-full flex gap-2 flex-col">
          <h2 className="text-md font-bold mt-2">Ingredients</h2>

          {recipeItems.map((recipeItem, index) => (
            <ShoppingItem
              key={"item-" + index}
              name={recipeItem.itemName}
              amount={recipeItem.amount}
              bought={false}
              onClick={() => removeItem(index)}
            />
          ))}
          <AddRecipeItemMenu onItemAdded={addItem} />
        </div>
      </div>

      <div className="flex gap-2 w-full mt-11">
        <Button asChild className="w-full" variant="secondary">
          <Link to="/discover">Cancel</Link>
        </Button>
        <Button className="w-full" onClick={saveRecipe}>
          Save
        </Button>
      </div>
    </Layout>
  );
}
