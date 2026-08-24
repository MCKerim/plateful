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
import { useEffect, useRef, useState } from "react";
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
import { nutritionApi, NutritionValues } from "@/api/nutrition.api";
import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import CollectionMultiSelect from "@/components/collections/CollectionMultiSelect";
import {
  useRecipeCollectionIds,
  useReplaceRecipeCollections,
} from "@/hooks/collections/useCollections";
import { recipeImageApi } from "@/api/recipeImage.api";

// Regex to remove common TLDs when generating recipe title from URL
const COMMON_TLD_REGEX = /\.com$|\.de$|\.net$|\.org$/i;

/**
 * Per-serving values rescaled to a new serving count, at display precision
 * (whole kcal/mg, grams to one decimal) so the numbers read as cleanly as an
 * estimate would. Same math as the iOS editor's servings-only rescale.
 */
function rescaleNutrition(values: NutritionValues, factor: number): NutritionValues {
  const scale = (value: number | null, decimals: 0 | 1): number | null => {
    if (value == null) return null;
    const scaled = value * factor;
    return decimals === 0 ? Math.round(scaled) : Number(scaled.toFixed(1));
  };
  return {
    calories_kcal: scale(values.calories_kcal, 0),
    carbs_g: scale(values.carbs_g, 1),
    protein_g: scale(values.protein_g, 1),
    fat_g: scale(values.fat_g, 1),
    sugar_g: scale(values.sugar_g, 1),
    fiber_g: scale(values.fiber_g, 1),
    sodium_mg: scale(values.sodium_mg, 0),
  };
}

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
  // Starts at 1 rather than empty: base_servings is NOT NULL, so a blank
  // field would just become 1 on save without the user seeing it. Null is
  // still allowed transiently so the field can be cleared while retyping.
  const [baseServings, setBaseServings] = useState<number | null>(1);
  // `undefined` until the editor reports values (loaded recipe or user action),
  // so saving before an edited recipe loads never wipes its saved nutrition.
  const [nutrition, setNutrition] = useState<NutritionValues | undefined>(undefined);
  // Mirrors `recipes.nutrition_auto`: on (default) = the backend re-estimates
  // whenever a save changes the ingredients and the editor fields are locked.
  const [nutritionAuto, setNutritionAuto] = useState(true);
  // Save-time diff baselines (what "unchanged" means) + whether the user
  // hand-edited the nutrition fields this session — values typed while the
  // toggle was off must be re-estimated if it's back on at save.
  const loadedNutritionAuto = useRef(true);
  const loadedIngredientLines = useRef<string[]>([]);
  const loadedBaseServings = useRef(1);
  const nutritionEdited = useRef(false);

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
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const navigate = useNavigate();
  const posthog = usePostHog();

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
      setBaseServings(recipe.base_servings ?? 1);
      setImageSupabaseUrl(recipe.image_path ?? "");
      setImageRemoved(false);
      setNutritionAuto(recipe.nutrition_auto);
      loadedNutritionAuto.current = recipe.nutrition_auto;
      loadedBaseServings.current = recipe.base_servings ?? 1;
    }
  }, [recipe]);

  // Populate ingredients when loaded (edit mode)
  useEffect(() => {
    if (existingIngredients.length > 0) {
      setIngredients(ingredientsToEditorItems(existingIngredients));
      loadedIngredientLines.current = existingIngredients
        .map((row) => row.rawText.trim())
        .filter((text) => text !== "");
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

  async function handleImageSelected(file: File | undefined, previewUrl: string) {
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      setImageRemoved(imageSupabaseUrl !== "");
      return;
    }

    // Keep the compressed draft local. Upload only after the recipe row exists
    // and Save is tapped, so cancelling cannot leave a temporary object behind.
    setImageUploading(true);
    try {
      const compressedFile = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
      setImageFile(compressedFile);
      setImagePreview(previewUrl);
      setImageRemoved(false);
    } catch {
      toast.error(t("addRecipe.errors.uploadFailed"));
    } finally {
      setImageUploading(false);
    }
  }

  function handleDeleteImage() {
    setImageFile(null);
    setImagePreview("");
    setImageRemoved(imageSupabaseUrl !== "");
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

    // What this save should do about nutrition, decided in one place — the
    // web port of the iOS editor's nutritionPlan(). While `nutrition_auto` is
    // on, the backend owns the seven columns: writing this editor's snapshot
    // back would race (and erase) an estimate that landed mid-edit, so the
    // update omits them unless there is a concrete local value to write.
    const editingExisting = Boolean(recipeId ?? createdRecipeId);
    const valuesEmpty =
      !nutrition || Object.values(nutrition).every((value) => value == null);
    // Order-insensitive: reordering lines changes no food, so it neither
    // deserves an AI call nor blocks the servings rescale below.
    const linesChanged =
      [...ingredientLines].sort().join("\n") !==
      [...loadedIngredientLines.current].sort().join("\n");
    const wantsNutritionRefresh =
      nutritionAuto &&
      ingredientLines.length > 0 &&
      (linesChanged || !loadedNutritionAuto.current || nutritionEdited.current || valuesEmpty);

    let nutritionWrite: NutritionValues | null | undefined;
    if (!nutritionAuto || !editingExisting) {
      // Manual mode (the fields are the user's, verbatim) — and an insert has
      // no columns to leave untouched.
      nutritionWrite = nutrition;
    } else if (wantsNutritionRefresh) {
      nutritionWrite = undefined; // the worker writes the real values
    } else if (ingredientLines.length === 0 && loadedIngredientLines.current.length > 0) {
      // Emptied the recipe: the stored per-serving values lost their basis.
      nutritionWrite = null; // recipeApi maps null → clear all seven
    } else if (
      (baseServings ?? 1) !== loadedBaseServings.current &&
      loadedBaseServings.current > 0 &&
      (baseServings ?? 1) > 0 &&
      nutrition &&
      !valuesEmpty
    ) {
      // Servings-only change: deterministic local rescale — same food,
      // different denominator, no AI call.
      nutritionWrite = rescaleNutrition(
        nutrition,
        loadedBaseServings.current / (baseServings ?? 1)
      );
    } else {
      nutritionWrite = undefined; // untouched under auto: leave the columns alone
    }

    try {
      let targetRecipeId = recipeId ?? createdRecipeId;

      if (targetRecipeId) {
        await updateRecipeMutation.mutateAsync({
          recipeId: targetRecipeId,
          name: title.trim(),
          description: description || null,
          instructions: instructionsMarkdown,
          link,
          baseServings: baseServings ?? 1,
          nutrition: nutritionWrite,
          nutritionAuto,
        });
      } else {
        const createdRecipe = await createRecipeMutation.mutateAsync({
          name: title.trim(),
          description: description || null,
          instructions: instructionsMarkdown,
          link,
          householdId: householdId!,
          baseServings: baseServings ?? 1,
          nutrition: nutritionWrite,
          nutritionAuto,
        });
        targetRecipeId = createdRecipe.id;
        // Keep the ID before any secondary save. A retry after an image,
        // ingredient, instruction, or membership error updates this recipe
        // instead of inserting a duplicate.
        setCreatedRecipeId(createdRecipe.id);
      }

      if (imageFile) {
        setImageUploading(true);
        try {
          const imagePath = await recipeImageApi.uploadCover(supabase, targetRecipeId, imageFile);
          setImageSupabaseUrl(imagePath);
          setImageFile(null);
          setImageRemoved(false);
        } finally {
          setImageUploading(false);
        }
      } else if (imageRemoved) {
        await recipeImageApi.clearCover(supabase, targetRecipeId);
        setImageSupabaseUrl("");
        setImageRemoved(false);
      }

      await saveIngredients(targetRecipeId);

      // AFTER the ingredient rows above — they are what the worker estimates
      // from. Best-effort: the recipe is saved either way, and the values
      // arrive via Realtime whether or not this page is still open.
      if (wantsNutritionRefresh) {
        try {
          await nutritionApi.refresh(supabase, targetRecipeId);
        } catch (error) {
          console.error("Nutrition refresh request failed", error);
        }
      }

      await replaceCollectionsMutation.mutateAsync({
        recipeId: targetRecipeId,
        collectionIds: selectedCollectionIds ?? membershipsQuery.data ?? [],
      });

      if (recipeId && nutritionAuto !== loadedNutritionAuto.current) {
        posthog?.capture(AnalyticsEvent.nutritionAutoToggled, { enabled: nutritionAuto });
      }

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
            replaceCollectionsMutation.isPending ||
            imageUploading
          }
        >
          {createRecipeMutation.isPending ||
          updateRecipeMutation.isPending ||
          replaceCollectionsMutation.isPending ||
          imageUploading
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
            onBlur={() => setBaseServings((current) => (current && current >= 1 ? current : 1))}
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
          onEdited={() => {
            nutritionEdited.current = true;
          }}
          auto={nutritionAuto}
          onAutoChange={setNutritionAuto}
        />
      </div>
    </Layout>
  );
}
