import AddRecipeItemMenu from "@/components/atoms/AddRecipeItemMenu";
import ShoppingItem from "@/components/atoms/ShoppingItem";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";

type RecipeItem = {
  itemName: string;
  amount: string;
};

export default function AddRecipe() {
  const { t } = useTranslation();

  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);

  const navigate = useNavigate();

  const searchUrl = searchParams.get("url");
  const searchTitle = searchParams.get("title");
  const searchText = searchParams.get("text");

  useEffect(() => {
    /*
    nimmt url aus url
    falls nicht nimm aus text
    - falls nicht nimm aus title

    nimmt title aus title
    - falls nicht nimm aus text
    */
    const extractSharedData = () => {
      if(!searchUrl && !searchTitle && !searchText) {
        return;
      }

      let finalUrl = "";
      let finalTitle = "";

      if (searchUrl) {
        finalUrl = searchUrl;
      }

      if (!finalUrl && searchText) {
        const urlMatch = searchText.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          finalUrl = urlMatch[0];
        }
      }

      if (searchTitle) {
        finalTitle = searchTitle;
      }

      setTitle(finalTitle);
      setLink(finalUrl);
    };

    extractSharedData();
  }, [searchUrl, searchTitle, searchText]);

  useEffect(() => {
    async function getRecipe(): Promise<boolean> {
      if (!params.recipeId) return false;
      const recipeId = parseInt(params.recipeId);

      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId);

      if (!data || data.length === 0) {
        return false;
      }

      setTitle(data[0].name);
      setDescription(data[0].description ?? "");
      setLink(data[0].link ?? "");
      return true;
    }

    getRecipe().then((hasFound) => {
      if (hasFound) return;
      const recipeNameFromSearch = searchParams.get("recipeNameFromSearch");
      if (recipeNameFromSearch !== null) {
        setTitle(recipeNameFromSearch.trim());
        setSearchParams("");
      }
    });
  }, [params.recipeId, searchParams, setSearchParams]);

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
    if (title === "") {
      alert("Please fill in all fields.");
      return;
    }

    if (params.recipeId) {
      // Update existing recipe
      const recipeId = parseInt(params.recipeId);
      const { data, error } = await supabase
        .from("recipes")
        .update({ name: title, description, link })
        .eq("id", recipeId)
        .select();

      if (!error && data) {
        //await saveRecipeItems(recipeId);
        navigate(`/recipe/${recipeId}`);
      } else {
        console.error(error);
        alert("An error occurred. Please try again.");
      }
    } else {
      // Insert new recipe
      const { data, error } = await supabase
        .from("recipes")
        .insert([{ name: title, description, link }])
        .select();

      if (!error && data) {
        await saveRecipeItems(data[0].id);
      } else {
        console.error(error);
        alert("An error occurred. Please try again.");
      }
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
        navigate(`/recipe/${recipeId}`);
      }
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-10">
        {params.recipeId ? t("addRecipe.editRecipe") : t("addRecipe.addRecipe")}
      </h1>

      <div className="grid w-full items-center gap-5">
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="title">{t("addRecipe.name")}</Label>
          <Input
            type="text"
            id="title"
            placeholder={t("addRecipe.namePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid w-full gap-2">
          <Label htmlFor="message">{t("addRecipe.description")}</Label>
          <Textarea
            placeholder={t("addRecipe.descriptionPlaceholder")}
            id="message"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid w-full items-center gap-2">
          <Label htmlFor="link">{t("addRecipe.link")}</Label>
          <Input
            type="text"
            id="link"
            placeholder={t("addRecipe.linkPlaceholder")}
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <div className="w-full flex gap-2 flex-col">
          <h2 className="text-md font-bold mt-2">{t("ingredients")}</h2>

          {recipeItems.map((recipeItem, index) => (
            <ShoppingItem
              key={"item-" + index}
              id={0}
              name={recipeItem.itemName}
              amount={recipeItem.amount}
              bought={false}
              onClick={() => removeItem(index)}
              onEdit={() => {}}
            />
          ))}
          <AddRecipeItemMenu onItemAdded={addItem} />
        </div>
      </div>

      <div className="flex gap-2 w-full mt-11">
        <Button asChild className="w-full" variant="secondary">
          <Link
            to={params.recipeId ? `/recipe/${params.recipeId}` : "/discover"}
          >
            {t("common.cancel")}
          </Link>
        </Button>
        <Button className="w-full" onClick={saveRecipe}>
          {t("common.save")}
        </Button>
      </div>
    </Layout>
  );
}
