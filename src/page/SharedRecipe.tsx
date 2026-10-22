import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { motion } from "motion/react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import NutritionSection from "@/components/recipe/NutritionSection";
import RecipePageSkeleton from "@/components/recipe/RecipePageSkeleton";
import SourceLinkButton from "@/components/recipe/SourceLinkButton";
import InstructionSteps from "@/components/instructions/InstructionSteps";
import { IngredientRow } from "@/components/ingredients/IngredientRow";
import { ServingScaler } from "@/components/ingredients/ServingScaler";
import { barButton, glass } from "@/components/recipe/glass";
import { snapshotNutrition } from "@/lib/transformers/recipeShare.transformer";
import { useRecipeShare } from "@/hooks/recipe/useRecipeShare";
import { useImportRecipeShare } from "@/hooks/recipe/useImportRecipeShare";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { groupIngredients } from "@/lib/transformers/ingredient.transformer";
import { parseInstructionsMarkdown } from "@/lib/transformers/instruction.transformer";
import { scaleIngredients } from "@/lib/ingredient-parser/scale-ingredients";
import { canScale } from "@/lib/shopping-list/planAdd";
import { isTrustedRecipeImageUrl } from "@/api/recipeImage.api";
import { mobileStoreUrl, openInAppLink } from "@/lib/appStores";
import { cn } from "@/lib/utils";
import type { SnapshotIngredient } from "@/types/recipeShare.types";
import type { RecipeIngredient } from "@/types/ingredient.types";
import type { RecipeInstruction } from "@/types/instruction.types";
import { toast } from "sonner";
import { Download, Plus, X } from "lucide-react";

const PLATEFUL_URL = "https://plateful.cloud";

// The floating bottom action, like the recipe page's Cook capsule.
const actionClass = "pointer-events-auto h-12 w-full rounded-full text-base font-semibold shadow-sm";

/** Map a snapshot ingredient to the RecipeIngredient shape needed by groupIngredients */
function toDisplayIngredient(ing: SnapshotIngredient, index: number): RecipeIngredient {
  return {
    id: `snap-${index}`,
    recipeId: "",
    rawText: ing.raw_text,
    quantity: {
      value: ing.quantity_value,
      display: ing.quantity_display,
    },
    unit: ing.unit,
    unitNormalized: null,
    name: ing.ingredient_name,
    nameNormalized: null,
    preparationNote: ing.preparation_note,
    isOptional: ing.is_optional ?? false,
    groupName: ing.group_name,
    sortOrder: ing.sort_order,
    isScalable: ing.is_scalable ?? true,
    ingredientSlug: null,
  };
}

/**
 * The recipe page's read-only twin, like the native `SharedRecipeView`: a
 * shared recipe reads exactly like it will once saved, with a floating Save
 * capsule where the recipe page has its actions.
 */
export default function SharedRecipe() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const user = useAppSelector(selectUser);
  const householdId = useAppSelector(selectHouseholdId);

  const { data: share, isLoading, isError } = useRecipeShare(token ?? null);
  const importMutation = useImportRecipeShare();

  const isNative = Capacitor.isNativePlatform();
  const isLoggedIn = user !== null;
  // The servings shown; scales the amounts only, as on iOS (nothing to save here).
  const [servings, setServings] = useState<number | null>(null);

  async function handleSave() {
    if (!share || !user || !householdId || !token) return;

    importMutation.mutate(
      { token, householdId },
      {
        onSuccess: () => {
          toast.success(t("share.importSuccess"));
          // Where the import shows until the recipe lands, as after a pasted link.
          navigate("/cookbook", { replace: true });
        },
        onError: () => {
          toast.error(t("share.importError"));
        },
      }
    );
  }

  function handleClose() {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/home");
  }

  function handleDownloadApp() {
    window.open(mobileStoreUrl() ?? PLATEFUL_URL, "_blank");
  }

  if (isLoading) return <RecipePageSkeleton />;

  if (isError || !share) {
    const notFoundFooter = !isNative ? (
      <div className="pointer-events-none fixed bottom-0 z-20 w-full max-w-lg px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button variant="outline" className={actionClass} onClick={handleDownloadApp}>
          <Download size={18} />
          {t("share.downloadApp")}
        </Button>
      </div>
    ) : undefined;

    return (
      <Layout showHeader={false} showFooter={false} footer={notFoundFooter}>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-16 px-4">
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <p className="first-font text-xl font-bold">{t("share.notFound")}</p>
            <p className="text-muted-foreground text-sm">{t("share.notFoundDescription")}</p>
          </motion.div>

          {!isNative && <div className="h-16" />}
        </div>
      </Layout>
    );
  }

  const { snapshot } = share;
  const trustedImageUrls = snapshot.image_urls.filter((url) => isTrustedRecipeImageUrl(url));
  const displayIngredients = snapshot.ingredients.map(toDisplayIngredient);
  const baseServings = snapshot.base_servings ?? 1;
  const targetServings = servings ?? baseServings;
  const groupedIngredients = groupIngredients(
    scaleIngredients(displayIngredients, baseServings, targetServings)
  );
  // Structured steps; old shares (made before steps existed) only carry the
  // markdown, and a link out in the world can't be fixed, so it is parsed.
  const stepInputs =
    snapshot.instruction_steps && snapshot.instruction_steps.length > 0
      ? snapshot.instruction_steps.map((step) => ({ stepText: step.step_text, groupName: step.group_name }))
      : snapshot.instructions
        ? parseInstructionsMarkdown(snapshot.instructions)
        : [];
  const steps: RecipeInstruction[] = stepInputs.map((step, index) => ({
    id: `step-${index}`,
    recipeId: "",
    stepText: step.stepText,
    groupName: step.groupName ?? null,
    sortOrder: index,
    annotation: null,
  }));
  const nutrition = snapshotNutrition(snapshot);

  const saveButton =
    isLoggedIn && householdId ? (
      <Button className={actionClass} onClick={handleSave} disabled={importMutation.isPending}>
        <Plus className="!size-5" />
        {importMutation.isPending ? t("share.importing") : t("share.saveToMyRecipes")}
      </Button>
    ) : null;

  // On a phone the recipe is saved in the app: this opens it when installed,
  // else the store.
  const appLink = isNative || !token ? null : openInAppLink("share", token);
  const storeButton =
    !saveButton && appLink ? (
      <Button asChild className={actionClass}>
        <a href={appLink}>
          <Plus className="!size-5" />
          {t("share.saveRecipe")}
        </a>
      </Button>
    ) : null;

  const loginButton =
    !saveButton && !storeButton && !isLoggedIn ? (
      <Button className={actionClass} onClick={() => navigate("/signup")}>
        <Plus className="!size-5" />
        {t("share.saveRecipe")}
      </Button>
    ) : null;

  const action = saveButton ?? storeButton ?? loginButton;
  // Sticky, not fixed + spacer: it keeps its own room under the last step.
  // No bar of its own, the page scrolls on under the capsule.
  const footer = action ? (
    <div className="pointer-events-none sticky bottom-0 z-20 w-full px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {action}
    </div>
  ) : undefined;

  return (
    <Layout showHeader={false} showFooter={false} footer={footer} noTopPadding={isLoggedIn}>
      {/* Only someone in the app has somewhere to go back to; a visitor from a link has not. */}
      {isLoggedIn && (
        <div className="pointer-events-none sticky top-0 z-20 flex justify-end pt-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(glass, barButton, "pointer-events-auto")}
            onClick={handleClose}
            aria-label={t("common.close")}
          >
            <X className="!size-5" />
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* No photo, no hero: there is no cover to add here. */}
        {trustedImageUrls.length > 0 && (
          <PhotoProvider maskOpacity={0.5} bannerVisible={false}>
            <AspectRatio ratio={4 / 3}>
              {trustedImageUrls.map((url, index) => (
                <PhotoView key={index} src={url}>
                  {index < 1 ? (
                    <img
                      src={url}
                      alt="Recipe"
                      className="object-cover w-full h-full rounded-[28px] dark:brightness-75 cursor-pointer"
                    />
                  ) : undefined}
                </PhotoView>
              ))}
            </AspectRatio>
          </PhotoProvider>
        )}

        <div className="flex flex-col gap-3">
          <h1 className="first-font text-2xl font-bold break-words w-full">{snapshot.name}</h1>

          {snapshot.link && <SourceLinkButton link={snapshot.link} />}

          {snapshot.description && (
            <p className="text-base text-muted-foreground whitespace-pre-wrap">{snapshot.description}</p>
          )}
        </div>

        {/* Nutrition — the sharer's values, when the snapshot carries them */}
        {nutrition && <NutritionSection nutrition={nutrition} />}

        {/* The recipe page's section in preview mode: scalable, not checkable. */}
        {displayIngredients.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold">{t("ingredients.title")}</h2>

              {canScale(snapshot.base_servings, displayIngredients) && (
                <ServingScaler
                  value={targetServings}
                  onChange={setServings}
                  unit={snapshot.servings_unit ?? "servings"}
                />
              )}
            </div>

            {groupedIngredients.map((group, groupIndex) => (
              <div key={group.name ?? `group-${groupIndex}`}>
                {group.name && (
                  <h3 className="pt-1 text-sm font-semibold text-muted-foreground">{group.name}</h3>
                )}
                <ul>
                  {group.ingredients.map((ingredient) => (
                    <IngredientRow
                      key={ingredient.id}
                      ingredient={ingredient}
                      baseServings={baseServings}
                      targetServings={targetServings}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {steps.length > 0 && <InstructionSteps steps={steps} />}
      </div>
    </Layout>
  );
}
