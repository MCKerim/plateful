import { ImagePicker } from "@/components/general/ImagePicker";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IMAGE_COMPRESSION_OPTIONS } from "@/lib/constants";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { useSupabase } from "@/utils/supabase";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories, getTranslatedCategory } from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import { selectCategoryId } from "@/redux/slices/filterAndSortingSlice";
import DeleteDialog from "@/components/general/DeleteDialog";
import { useRecipeForEdit } from "@/hooks/recipe/useRecipeForEdit";
import { useCreateRecipe } from "@/hooks/recipe/useCreateRecipe";
import { useUpdateRecipe } from "@/hooks/recipe/useUpdateRecipe";
import { useDeleteRecipe } from "@/hooks/recipe/useDeleteRecipe";
import {
  SimpleIngredientEditor,
  ingredientsToEditorItems,
  editorItemsToInputs,
} from "@/components/ingredients/IngredientEditor";
import type { EditorItem } from "@/components/ingredients/IngredientEditor";
import { useRecipeIngredients } from "@/hooks/ingredients/useRecipeIngredients";
import { useReplaceAllIngredients } from "@/hooks/ingredients/useIngredientMutations";

// Regex to remove common TLDs when generating recipe title from URL
const COMMON_TLD_REGEX = /\.com$|\.de$|\.net$|\.org$/i;

export default function AddRecipe() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();

  const params = useParams();
  const [searchParams] = useSearchParams();

  const householdId = useAppSelector(selectHouseholdId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [link, setLink] = useState("");
  const [ingredients, setIngredients] = useState<EditorItem[]>([]);
  const [baseServings, setBaseServings] = useState<number | null>(null);

  const filterCategoryId = useAppSelector(selectCategoryId);
  const [category, setCategory] = useState(filterCategoryId === 0 ? null : filterCategoryId);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageSupabaseUrl, setImageSupabaseUrl] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);

  const navigate = useNavigate();

  const recipeId = params.recipeId ?? null;

  // React Query hooks
  const { recipe, imageInfo } = useRecipeForEdit(recipeId);
  const { data: existingIngredients = [] } = useRecipeIngredients(recipeId);
  const createRecipeMutation = useCreateRecipe();
  const updateRecipeMutation = useUpdateRecipe();
  const deleteRecipeMutation = useDeleteRecipe();
  const replaceIngredientsMutation = useReplaceAllIngredients();

  const searchUrl = searchParams.get("url");
  const searchTitle = searchParams.get("title");
  const searchText = searchParams.get("text");

  useEffect(() => {
    const extractSharedData = () => {
      let finalUrl = "";
      let finalTitle = "";

      const urlRegex = /(https?:\/\/[^\s]+)/i;

      // --- Extract clean URL from searchUrl ---
      if (searchUrl) {
        const match = urlRegex.exec(searchUrl);
        if (match) {
          finalUrl = match[0];
        } else {
          finalUrl = searchUrl.trim();
        }
      }

      // --- Fallback: extract URL from searchText ---
      if (!finalUrl && searchText) {
        const match = urlRegex.exec(searchText);
        if (match) {
          finalUrl = match[0];
        }
      }

      // --- Use given title if provided ---
      if (searchTitle) {
        finalTitle = searchTitle.trim();
      }

      // --- Chefkoch cleanup ---
      if (finalTitle.toLowerCase().includes(" - gefunden auf chefkoch.de")) {
        finalTitle = finalTitle.replace(/ - gefunden auf chefkoch\.de$/i, "").trim();
      }

      // --- Generate fallback title ---
      if (!finalTitle) {
        // Try to extract readable text before the URL
        if (searchUrl?.includes("http")) {
          const beforeUrl = searchUrl.split("http")[0].trim();
          if (beforeUrl) {
            finalTitle = beforeUrl;
          }
        }

        // Still empty? Try to make something nice from the hostname
        if (!finalTitle && finalUrl) {
          try {
            const hostname = new URL(finalUrl).hostname
              .replace(/^www\./, "")
              .replace(COMMON_TLD_REGEX, "");

            const parts = hostname.split(".");
            // Take last 1-2 parts to avoid subdomains like "s."
            const mainName = parts.length > 2 ? parts[parts.length - 2] : parts[0];
            const capitalized = mainName.charAt(0).toUpperCase() + mainName.slice(1);
            finalTitle = capitalized;
          } catch {
            finalTitle = finalUrl;
          }
        }

        // Last resort: fallback from text param
        if (!finalTitle && searchText) {
          const beforeUrl = searchText.split("http")[0].trim();
          if (beforeUrl) {
            finalTitle = beforeUrl;
          }
        }
      }

      setTitle(finalTitle);
      setLink(finalUrl);
    };

    extractSharedData();
  }, [searchUrl, searchTitle, searchText]);

  // Populate form when recipe data is loaded (edit mode)
  useEffect(() => {
    if (recipe) {
      setTitle(recipe.name);
      setDescription(recipe.description ?? "");
      setInstructions(recipe.instructions ?? "");
      setLink(recipe.link ?? "");
      setCategory(recipe.category);
      setBaseServings(recipe.base_servings);
    }
  }, [recipe]);

  // Populate ingredients when loaded (edit mode)
  useEffect(() => {
    if (existingIngredients.length > 0) {
      setIngredients(ingredientsToEditorItems(existingIngredients));
    }
  }, [existingIngredients]);

  // Populate image when image info is loaded (edit mode)
  useEffect(() => {
    if (imageInfo) {
      setImagePreview(imageInfo.signedUrl);
      setImageSupabaseUrl(imageInfo.path);
    }
  }, [imageInfo]);

  // Handle recipeNameFromSearch when not editing
  useEffect(() => {
    if (!recipeId) {
      const recipeNameFromSearch = searchParams.get("recipeNameFromSearch");
      if (recipeNameFromSearch !== null) {
        setTitle(recipeNameFromSearch.trim());
      }
    }
  }, [recipeId, searchParams]);

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
      toast.error(t("addRecipe.errors.uploadFailed") + ": " + error.message);
      return null;
    }
    return filePath;
  }

  async function handleImageSelected(file: File | undefined, previewUrl: string) {
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      setImageSupabaseUrl("");
      return;
    }

    // Compress and resize the image before upload
    const compressedFile = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
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
      toast.error(t("addRecipe.errors.nameRequired"));
      return;
    }

    if (category === null) {
      toast.error(t("addRecipe.errors.categoryRequired"));
      return;
    }

    // Helper to save ingredients
    const saveIngredients = async (targetRecipeId: string) => {
      const inputs = editorItemsToInputs(ingredients);

      if (inputs.length > 0) {
        await replaceIngredientsMutation.mutateAsync({
          recipeId: targetRecipeId,
          inputs,
        });
      }
    };

    if (recipeId) {
      // Update existing recipe
      updateRecipeMutation.mutate(
        {
          recipeId,
          name: title,
          description: description || null,
          instructions: instructions || null,
          link,
          category,
          baseServings,
        },
        {
          onSuccess: async () => {
            // If a new image was uploaded, move it to the correct folder if needed
            if (imageFile && imageSupabaseUrl?.includes("temp")) {
              const newPath = `recipe_${recipeId}/${imageSupabaseUrl.split("/").pop()}`;
              await supabase.storage.from("recipeimages").move(imageSupabaseUrl, newPath);
            }
            // Save ingredients
            await saveIngredients(recipeId);
            toast.success(t("addRecipe.recipeSaved"));
            navigate(`/recipe/${recipeId}`, { replace: true });
          },
          onError: (error) => {
            console.error(error);
            toast.error(t("common.error"));
          },
        }
      );
    } else {
      // Insert new recipe
      createRecipeMutation.mutate(
        {
          name: title,
          description: description || null,
          instructions: instructions || null,
          link,
          category,
          householdId: householdId!,
          baseServings,
        },
        {
          onSuccess: async (data) => {
            // If an image was uploaded, move it to the correct folder with the new recipe id
            if (imageFile && imageSupabaseUrl) {
              const newPath = `recipe_${data.id}/${imageSupabaseUrl.split("/").pop()}`;
              await supabase.storage.from("recipeimages").move(imageSupabaseUrl, newPath);
            }
            // Save ingredients
            await saveIngredients(data.id);
            toast.success(t("addRecipe.recipeSaved"));
            navigate(`/recipe/${data.id}`, { replace: true });
          },
          onError: (error) => {
            console.error(error);
            toast.error(t("common.error"));
          },
        }
      );
    }
  }

  function deleteRecipe() {
    if (!recipeId) return;

    deleteRecipeMutation.mutate(recipeId, {
      onSuccess: () => {
        toast.success(t("addRecipe.recipeDeleted"));
        navigate("/cookbook");
      },
      onError: (error) => {
        console.error("Error while deleting recipe: ", error);
        toast.error(t("addRecipe.errors.deleteFailed"));
      },
    });
  }

  const saveFooter = (
    <>
      <div style={{ height: "calc(100px + var(--safe-area-bottom, 0px))" }}></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 px-4 pt-4 flex gap-2 border-border border-t-[1px]" style={{ paddingBottom: "calc(1rem + var(--safe-area-bottom, 0px))" }}>
        <Button className="w-full" variant="secondary" onClick={() => navigate(-1)}>
          {t("common.cancel")}
        </Button>

        <Button
          className="w-full"
          variant="accent"
          onClick={saveRecipe}
          disabled={createRecipeMutation.isPending || updateRecipeMutation.isPending}
        >
          {createRecipeMutation.isPending || updateRecipeMutation.isPending
            ? t("common.saving")
            : t("common.save")}
        </Button>
      </div>
    </>
  );

  return (
    <Layout showHeader={false} showFooter={false} footer={saveFooter}>
      <div className="flex justify-between w-full items-center">
        <h1 className="text-2xl font-bold first-font">
          {params.recipeId ? t("addRecipe.editRecipe") : t("addRecipe.addRecipe")}
        </h1>

        {params.recipeId && (
          <DeleteDialog onDelete={deleteRecipe} loading={deleteRecipeMutation.isPending} />
        )}
      </div>

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
            onValueChange={(value) => setCategory(value ? parseInt(value) : null)}
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

        <div className="grid items-center w-full gap-2">
          <Label htmlFor="description">{t("addRecipe.description")}</Label>

          <Textarea
            id="description"
            placeholder={t("addRecipe.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            enterKeyHint="next"
            rows={2}
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
        </div>

        {/* Servings */}
        <div className="grid items-center w-full gap-2">
          <Label htmlFor="servings">{t("addRecipe.servings")}</Label>

          <Input
            type="number"
            id="servings"
            placeholder={t("addRecipe.servingsPlaceholder")}
            value={baseServings ?? ""}
            onChange={(e) => setBaseServings(e.target.value ? parseInt(e.target.value) : null)}
            min={1}
          />
        </div>

        {/* Ingredients Section */}
        <div className="grid w-full gap-2">
          <Label>{t("ingredients.title")}</Label>

          <SimpleIngredientEditor items={ingredients} onChange={setIngredients} />
        </div>

        {/* Instructions Section */}
        <div className="grid w-full gap-2">
          <Label htmlFor="instructions">{t("recipe.instructions")}</Label>

          <Textarea
            id="instructions"
            placeholder={t("addRecipe.instructionsPlaceholder")}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            enterKeyHint="enter"
          />
        </div>
      </div>
    </Layout>
  );
}
