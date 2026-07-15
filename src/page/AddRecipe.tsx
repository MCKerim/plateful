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
import { selectCollectionSelection } from "@/redux/slices/filterAndSortingSlice";
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
import { useRecipeInstructions } from "@/hooks/instructions/useRecipeInstructions";
import { useReplaceAllInstructions } from "@/hooks/instructions/useInstructionMutations";
import {
  SimpleInstructionEditor,
  instructionsToEditorItems,
  editorItemsToStepInputs,
} from "@/components/instructions/InstructionEditor";
import {
  instructionsToMarkdown,
  parseInstructionsMarkdown,
} from "@/lib/transformers/instruction.transformer";
import NutritionEditor from "@/components/recipe/NutritionEditor";
import { NutritionValues } from "@/api/nutrition.api";
import CollectionMultiSelect from "@/components/collections/CollectionMultiSelect";
import {
  useRecipeCollectionIds,
  useReplaceRecipeCollections,
} from "@/hooks/collections/useCollections";

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
  const [instructionItems, setInstructionItems] = useState<EditorItem[]>([]);
  const [link, setLink] = useState("");
  const [ingredients, setIngredients] = useState<EditorItem[]>([]);
  const [baseServings, setBaseServings] = useState<number | null>(null);
  // `undefined` until the editor reports values (loaded recipe or user action),
  // so saving before an edited recipe loads never wipes its saved nutrition.
  const [nutrition, setNutrition] = useState<NutritionValues | undefined>(undefined);

  const filterCollectionSelection = useAppSelector(selectCollectionSelection);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[] | null>(() => {
    if (params.recipeId) return null;
    return filterCollectionSelection && filterCollectionSelection !== "all"
      ? [filterCollectionSelection]
      : [];
  });
  const [createdRecipeId, setCreatedRecipeId] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageSupabaseUrl, setImageSupabaseUrl] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);

  const navigate = useNavigate();

  const recipeId = params.recipeId ?? null;

  // React Query hooks
  const { recipe, imageInfo } = useRecipeForEdit(recipeId);
  const membershipsQuery = useRecipeCollectionIds(recipeId);
  const { data: existingIngredients = [] } = useRecipeIngredients(recipeId);
  const { data: existingInstructions = [], isSuccess: instructionsLoaded } =
    useRecipeInstructions(recipeId);
  const createRecipeMutation = useCreateRecipe();
  const updateRecipeMutation = useUpdateRecipe();
  const deleteRecipeMutation = useDeleteRecipe();
  const replaceIngredientsMutation = useReplaceAllIngredients();
  const replaceInstructionsMutation = useReplaceAllInstructions();
  const replaceCollectionsMutation = useReplaceRecipeCollections();

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
      setLink(recipe.link ?? "");
      setBaseServings(recipe.base_servings);
    }
  }, [recipe]);

  // Populate ingredients when loaded (edit mode)
  useEffect(() => {
    if (existingIngredients.length > 0) {
      setIngredients(ingredientsToEditorItems(existingIngredients));
    }
  }, [existingIngredients]);

  // Populate instruction steps when loaded (edit mode). Recipes created by
  // older app versions have no step rows yet — parse their legacy markdown so
  // saving converts them to structured steps.
  useEffect(() => {
    if (!instructionsLoaded || !recipe) return;
    if (existingInstructions.length > 0) {
      setInstructionItems(instructionsToEditorItems(existingInstructions));
    } else if (recipe.instructions) {
      setInstructionItems(
        instructionsToEditorItems(
          parseInstructionsMarkdown(recipe.instructions).map((input) => ({
            stepText: input.stepText,
            groupName: input.groupName ?? null,
          }))
        )
      );
    }
  }, [instructionsLoaded, existingInstructions, recipe]);

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
    if (title.trim() === "") {
      toast.error(t("addRecipe.errors.nameRequired"));
      return;
    }

    if (recipeId && !membershipsQuery.isSuccess) {
      toast.error(t("collections.errors.membershipsUnavailable"));
      return;
    }

    // Step rows are the source of truth; the markdown column stays
    // dual-written from them for older app versions.
    const stepInputs = editorItemsToStepInputs(instructionItems);
    const instructionsMarkdown = instructionsToMarkdown(stepInputs) || null;

    // Helper to save ingredients + instruction steps
    const saveIngredients = async (targetRecipeId: string) => {
      const inputs = editorItemsToInputs(ingredients);

      if (inputs.length > 0) {
        await replaceIngredientsMutation.mutateAsync({
          recipeId: targetRecipeId,
          inputs,
        });
      }

      await replaceInstructionsMutation.mutateAsync({
        recipeId: targetRecipeId,
        inputs: stepInputs,
      });
    };

    try {
      let targetRecipeId = recipeId ?? createdRecipeId;

      if (targetRecipeId) {
        await updateRecipeMutation.mutateAsync({
          recipeId: targetRecipeId,
          name: title.trim(),
          description: description || null,
          instructions: instructionsMarkdown,
          link,
          // Existing recipes retain the compatibility value; a newly created
          // recipe stays unassigned in the legacy model.
          category: recipeId ? recipe?.category : null,
          baseServings,
          nutrition,
        });
      } else {
        const createdRecipe = await createRecipeMutation.mutateAsync({
          name: title.trim(),
          description: description || null,
          instructions: instructionsMarkdown,
          link,
          category: null,
          householdId: householdId!,
          baseServings,
          nutrition,
        });
        targetRecipeId = createdRecipe.id;
        // Keep the ID before any secondary save. A retry after an image,
        // ingredient, instruction, or membership error updates this recipe
        // instead of inserting a duplicate.
        setCreatedRecipeId(createdRecipe.id);
      }

      let finalImagePath: string | null = imageSupabaseUrl || null;
      if (imageFile && imageSupabaseUrl?.includes("temp")) {
        const newPath = `recipe_${targetRecipeId}/${imageSupabaseUrl.split("/").pop()}`;
        await supabase.storage.from("recipeimages").move(imageSupabaseUrl, newPath);
        finalImagePath = newPath;
        setImageSupabaseUrl(newPath);
      }
      await supabase
        .from("recipes")
        .update({ image_path: finalImagePath })
        .eq("id", targetRecipeId);

      await saveIngredients(targetRecipeId);
      await replaceCollectionsMutation.mutateAsync({
        recipeId: targetRecipeId,
        collectionIds: selectedCollectionIds ?? membershipsQuery.data ?? [],
      });

      toast.success(t("addRecipe.recipeSaved"));
      navigate(`/recipe/${targetRecipeId}`, { replace: true });
    } catch (error) {
      console.error(error);
      toast.error(t("addRecipe.errors.saveFailed"));
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

  // Current ingredient lines (raw text, no section headers) for the nutrition estimate.
  const ingredientLines = ingredients
    .filter((item) => item.type === "ingredient")
    .map((item) => item.rawText.trim())
    .filter((text) => text !== "");

  // The loaded recipe's saved nutrition (edit mode), or null when adding / before load.
  const initialNutrition: NutritionValues | null = recipe
    ? {
        calories_kcal: recipe.calories_kcal,
        carbs_g: recipe.carbs_g,
        protein_g: recipe.protein_g,
        fat_g: recipe.fat_g,
        sugar_g: recipe.sugar_g,
        fiber_g: recipe.fiber_g,
        sodium_mg: recipe.sodium_mg,
      }
    : null;

  const saveFooter = (
    <>
      <div className="h-safe-b-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 pb-safe-4 flex gap-2 border-border border-t-[1px]">
        <Button
          className="w-full"
          variant="secondary"
          onClick={() =>
            recipeId ? navigate(`/recipe/${recipeId}`, { replace: true }) : navigate(-1)
          }
        >
          {t("common.cancel")}
        </Button>

        <Button
          className="w-full"
          variant="accent"
          onClick={saveRecipe}
          disabled={
            createRecipeMutation.isPending ||
            updateRecipeMutation.isPending ||
            replaceCollectionsMutation.isPending
          }
        >
          {createRecipeMutation.isPending ||
          updateRecipeMutation.isPending ||
          replaceCollectionsMutation.isPending
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

        {householdId && (
          <div className="grid items-center w-full gap-2">
            <Label>{t("collections.collections")}</Label>
            <CollectionMultiSelect
              householdId={householdId}
              selectedIds={selectedCollectionIds ?? membershipsQuery.data ?? []}
              onChange={setSelectedCollectionIds}
              disabled={!!recipeId && !membershipsQuery.isSuccess}
            />
          </div>
        )}

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
          <Label>{t("recipe.instructions")}</Label>

          <SimpleInstructionEditor items={instructionItems} onChange={setInstructionItems} />
        </div>

        {/* Nutrition Section */}
        <NutritionEditor
          initial={initialNutrition}
          onChange={setNutrition}
          title={title}
          servings={baseServings}
          ingredientLines={ingredientLines}
        />
      </div>
    </Layout>
  );
}
