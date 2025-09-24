//import AddRecipeItemMenu from "@/components/atoms/AddRecipeItemMenu";
//import ShoppingItem from "@/components/atoms/ShoppingItem";
import { ImagePicker } from "@/components/atoms/ImagePicker";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { useSupabase } from "@/utils/supabase";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import imageCompression from "browser-image-compression";
import { getTikTokPreview, urlToFile } from "@/lib/recipeImportHelper";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories, getTranslatedCategory } from "@/lib/recipeCategoryHelper";
import { selectCategoryId } from "@/redux/slices/filterAndSortingSlice";

/*type RecipeItem = {
  itemName: string;
  amount: string;
};*/

export default function AddRecipe() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();

  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const householdId = useAppSelector(selectHouseholdId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  const filterCategoryId = useAppSelector(selectCategoryId);
  const [category, setCategory] = useState(
    filterCategoryId === 0 ? null : filterCategoryId
  );

  //const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageSupabaseUrl, setImageSupabaseUrl] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);

  const navigate = useNavigate();

  const searchUrl = searchParams.get("url");
  const searchTitle = searchParams.get("title");
  const searchText = searchParams.get("text");

  // Extract shared data from URL or text
  useEffect(() => {
    /*
    nimmt url aus url
    falls nicht nimm aus text
    - falls nicht nimm aus title

    nimmt title aus title
    - falls nicht nimm aus text
    */
    const extractSharedData = () => {
      if (!searchUrl && !searchTitle && !searchText) {
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

      if (finalTitle.toLowerCase().includes(" - gefunden auf chefkoch.de")) {
        finalTitle = finalTitle
          .replace(/ - gefunden auf chefkoch\.de$/i, "")
          .trim();
      }

      setTitle(finalTitle);
      setLink(finalUrl);
    };

    extractSharedData();
  }, [searchUrl, searchTitle, searchText]);

  // Fetch recipe data if editing
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
      setCategory(data[0].category);

      // Fetch image from storage
      const { data: files, error } = await supabase.storage
        .from("recipeimages")
        .list(`recipe_${recipeId}/`);

      if (!error && files && files.length > 0) {
        // Get signed URL for the first image
        const { data: signedUrlData } = await supabase.storage
          .from("recipeimages")
          .createSignedUrl(`recipe_${recipeId}/${files[0].name}`, 3600);
        setImagePreview(signedUrlData?.signedUrl ?? "");
        setImageSupabaseUrl(`recipe_${recipeId}/${files[0].name}`);
      } else {
        setImagePreview("");
        setImageSupabaseUrl("");
      }
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

  /*function addItem(name: string, amount: string) {
    console.log("Adding item: ", name, amount);
    setRecipeItems([...recipeItems, { itemName: name, amount }]);
  }

  function removeItem(index: number) {
    const newItems = [...recipeItems];
    newItems.splice(index, 1);
    setRecipeItems(newItems);
  }*/

  async function uploadToSupabase(file: File) {
    setImageUploading(true);
    const fileExt = file.name.split(".").pop();
    // Use recipe id if editing, otherwise use 'new' (will be replaced after insert)
    const recipeIdForPath = params.recipeId ?? "temp";
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `recipe_${recipeIdForPath}/${fileName}`;
    const { error } = await supabase.storage
      .from("recipeimages")
      .upload(filePath, file, { upsert: true });
    setImageUploading(false);
    if (error) {
      alert("Upload failed: " + error.message);
      return null;
    }
    return filePath;
  }

  async function handleImageSelected(
    file: File | undefined,
    previewUrl: string
  ) {
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      setImageSupabaseUrl("");
      return;
    }

    // Compress and resize the image before upload
    const compressedFile = await imageCompression(file, {
      maxWidthOrHeight: 900, // Good for recipe images
      maxSizeMB: 0.5, // Target max file size (MB)
      useWebWorker: true,
      initialQuality: 0.85,
    });
    setImageFile(compressedFile);
    setImagePreview(previewUrl);
    const path = await uploadToSupabase(compressedFile);
    setImageSupabaseUrl(path ?? "");
  }

  async function handleDeleteImage() {
    if (imageSupabaseUrl) {
      await supabase.storage.from("recipeimages").remove([imageSupabaseUrl]);
    }
    setImageFile(null);
    setImagePreview("");
    setImageSupabaseUrl("");
  }

  async function saveRecipe() {
    if (title === "") {
      alert("Please enter a name for the recipe.");
      return;
    }

    if (category === null) {
      alert("Please select a category.");
      return;
    }

    if (params.recipeId) {
      // Update existing recipe
      const recipeId = parseInt(params.recipeId);
      const { data, error } = await supabase
        .from("recipes")
        .update({
          name: title,
          description,
          link,
          category,
        })
        .eq("id", recipeId)
        .select();
      if (!error && data) {
        // If a new image was uploaded, move it to the correct folder if needed
        if (
          imageFile &&
          imageSupabaseUrl &&
          imageSupabaseUrl.includes("temp")
        ) {
          const newPath = `recipe_${recipeId}/${imageSupabaseUrl
            .split("/")
            .pop()}`;
          await supabase.storage
            .from("recipeimages")
            .move(imageSupabaseUrl, newPath);
        }
        navigate(`/recipe/${recipeId}`, { replace: true });
      } else {
        console.error(error);
        alert("An error occurred. Please try again.");
      }
    } else {
      // Insert new recipe
      const { data, error } = await supabase
        .from("recipes")
        .insert([
          {
            name: title,
            description,
            link,
            household_id: householdId,
            category,
          },
        ])
        .select();
      if (!error && data) {
        // If an image was uploaded, move it to the correct folder with the new recipe id
        if (imageFile && imageSupabaseUrl) {
          const newPath = `recipe_${data[0].id}/${imageSupabaseUrl
            .split("/")
            .pop()}`;
          await supabase.storage
            .from("recipeimages")
            .move(imageSupabaseUrl, newPath);
        }
        navigate(`/recipe/${data[0].id}`, { replace: true });
      } else {
        console.error(error);
        alert("An error occurred. Please try again.");
      }
    }
  }

  /*async function saveItems() {
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
  }*/

  /*async function saveRecipeItems(recipeId: number) {
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
  }*/

  async function importRecipeData() {
    if (!link) {
      alert("Please enter a link.");
      return;
    }

    try {
      const data = await getTikTokPreview(link);
      if (!data) {
        alert("Failed to fetch TikTok preview. Please check the link.");
        return;
      }

      setTitle(data.title.trim().substring(0, 90) || "");
      setDescription(data.title.trim() || "");

      const file = await urlToFile(data.thumbnail_url, "tiktok-preview.jpg");
      if (!file) {
        alert("Failed to convert TikTok preview image to file.");
        return;
      }

      const compressedFile = await imageCompression(file, {
        maxWidthOrHeight: 900,
        maxSizeMB: 0.5,
        useWebWorker: true,
        initialQuality: 0.85,
      });

      setImageFile(compressedFile);
      setImagePreview(data.thumbnail_url); // Use the original preview URL for display

      const path = await uploadToSupabase(compressedFile);
      setImageSupabaseUrl(path ?? "");
    } catch (error) {
      console.error("Error importing TikTok recipe data:", error);
      alert(
        "An error occurred while importing the recipe data. Please try again."
      );
    }
  }

  async function deleteRecipe() {
    if (!params.recipeId) return false;

    const recipeId = parseInt(params.recipeId);

    // Delete all images from storage for this recipe
    const { data: files, error: listError } = await supabase.storage
      .from("recipeimages")
      .list(`recipe_${recipeId}/`);
    if (!listError && files && files.length > 0) {
      const paths = files.map((file) => `recipe_${recipeId}/${file.name}`);
      await supabase.storage.from("recipeimages").remove(paths);
    }

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (error) {
      console.error("Error while deleting recipe: ", error);
      alert("Error while deleting recipe");
    } else {
      navigate("/cookbook");
    }
  }

  return (
    <Layout>
      <h1 className="mb-10 text-2xl font-bold">
        {params.recipeId ? t("addRecipe.editRecipe") : t("addRecipe.addRecipe")}
      </h1>

      <div className="grid items-center w-full gap-5">
        <ImagePicker
          onImageSelected={handleImageSelected}
          onDeleteImage={handleDeleteImage}
          previewUrl={imagePreview}
          uploading={imageUploading}
        />

        <div className="grid items-center w-full gap-2">
          <Label htmlFor="title">{t("addRecipe.name")}</Label>

          <Textarea
            id="title"
            placeholder={t("addRecipe.namePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            enterKeyHint="next"
            rows={1}
          />
        </div>

        <div className="grid items-center w-full gap-2">
          <Label>{t("categorys.category")}</Label>

          <Select
            value={category?.toString() ?? ""}
            onValueChange={(value) =>
              setCategory(value ? parseInt(value) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("categorys.chooseACategory")} />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {getTranslatedCategory(t, category.id)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid w-full gap-2">
          <Label htmlFor="message">{t("addRecipe.description")}</Label>

          <Textarea
            id="message"
            placeholder={t("addRecipe.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            enterKeyHint="enter"
          />
        </div>

        <div className="grid items-center w-full gap-2">
          <Label htmlFor="link">{t("addRecipe.link")}</Label>

          <Input
            type="text"
            id="link"
            placeholder={t("addRecipe.linkPlaceholder")}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            autoComplete="off"
          />

          <Button variant="secondary" onClick={importRecipeData}>
            {t("addRecipe.importRecipeData")}
          </Button>
        </div>

        {/*<div className="flex flex-col w-full gap-2">
          <h2 className="mt-2 font-bold text-md">{t("ingredients")}</h2>

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
        </div>*/}
      </div>

      <div className="flex flex-col gap-2 mt-11">
        <Button className="w-full" onClick={saveRecipe}>
          {t("common.save")}
        </Button>

        {params.recipeId && (
          <Button
            className="w-full"
            onClick={deleteRecipe}
            variant="destructive"
          >
            {t("common.delete")}
          </Button>
        )}
      </div>
    </Layout>
  );
}
