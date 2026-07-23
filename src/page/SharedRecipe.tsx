import { useParams, useNavigate, NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { motion } from "motion/react";
import Rive from "@rive-app/react-canvas";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout/Layout";
import MarkdownRenderer from "@/components/general/MarkdownRenderer";
import { useRecipeShare } from "@/hooks/recipe/useRecipeShare";
import { useImportRecipeShare } from "@/hooks/recipe/useImportRecipeShare";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { groupIngredients } from "@/lib/transformers/ingredient.transformer";
import { instructionsToMarkdown } from "@/lib/transformers/instruction.transformer";
import { isTrustedRecipeImageUrl } from "@/api/recipeImage.api";
import type { SnapshotIngredient } from "@/types/recipeShare.types";
import type { RecipeIngredient } from "@/types/ingredient.types";
import { toast } from "sonner";
import { Download, BookmarkPlus, Link } from "lucide-react";

const PLATEFUL_URL = "https://plateful.cloud";

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
  };
}

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

  async function handleSave() {
    if (!share || !user || !householdId) return;

    importMutation.mutate(
      { snapshot: share.snapshot, householdId },
      {
        onSuccess: (newRecipeId) => {
          toast.success(t("share.importSuccess"));
          navigate(`/recipe/${newRecipeId}`, { replace: true });
        },
        onError: () => {
          toast.error(t("share.importError"));
        },
      }
    );
  }

  function handleDownloadApp() {
    window.open(PLATEFUL_URL, "_blank");
  }

  if (isLoading) {
    return (
      <Layout showHeader={false} showFooter={false}>
        <AspectRatio ratio={16 / 9}>
          <Skeleton className="w-full h-full rounded-md" />
        </AspectRatio>
        <Skeleton className="h-8 w-3/4 mt-2" />
        <Separator className="my-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Layout>
    );
  }

  if (isError || !share) {
    const notFoundFooter = !isNative ? (
      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 pb-safe-4 border-border border-t-[1px]">
        <Button variant="outline" className="w-full" onClick={handleDownloadApp}>
          <Download size={18} />
          {t("share.downloadApp")}
        </Button>
      </div>
    ) : undefined;

    return (
      <Layout showHeader={false} showFooter={false} footer={notFoundFooter}>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-16 px-4">
          <div className="w-48 h-48">
            <Rive src="/plateful-character.riv" artboard="Sad" />
          </div>

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
  const instructionsMarkdown =
    snapshot.instruction_steps && snapshot.instruction_steps.length > 0
      ? instructionsToMarkdown(
          snapshot.instruction_steps.map((step) => ({
            stepText: step.step_text,
            groupName: step.group_name,
          }))
        )
      : snapshot.instructions;
  const groupedIngredients = groupIngredients(displayIngredients);

  const saveButton =
    isLoggedIn && householdId ? (
      <Button className="w-full" onClick={handleSave} disabled={importMutation.isPending}>
        <BookmarkPlus size={18} />
        {importMutation.isPending ? t("share.importing") : t("share.saveToMyRecipes")}
      </Button>
    ) : null;

  const downloadButton = !isNative ? (
    <Button variant="outline" className="w-full" onClick={handleDownloadApp}>
      <Download size={18} />
      {t("share.downloadApp")}
    </Button>
  ) : null;

  const loginButton = !isLoggedIn ? (
    <Button className="w-full" onClick={() => navigate("/signup")}>
      {t("share.loginToSave")}
    </Button>
  ) : null;

  const footer = (
    <>
      <div className="h-safe-b-[80px]" />
      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 pb-safe-4 flex flex-col gap-2 border-border border-t-[1px]">
        {saveButton}
        {loginButton}
        {downloadButton}
      </div>
    </>
  );

  return (
    <Layout showHeader={false} showFooter={false} footer={footer}>
      {/* Image gallery */}
      {trustedImageUrls.length === 0 ? (
        <AspectRatio ratio={16 / 9}>
          <img
            src="/no-img.jpg"
            alt="Recipe"
            className="object-cover w-full h-full rounded-md dark:brightness-75"
          />
        </AspectRatio>
      ) : (
        <PhotoProvider maskOpacity={0.5} bannerVisible={false}>
          <AspectRatio ratio={16 / 9}>
            {trustedImageUrls.map((url, index) => (
              <PhotoView key={index} src={url}>
                {index < 1 ? (
                  <img
                    src={url}
                    alt="Recipe"
                    className="object-cover w-full h-full rounded-md dark:brightness-75 cursor-pointer"
                  />
                ) : undefined}
              </PhotoView>
            ))}
          </AspectRatio>
        </PhotoProvider>
      )}

      <h1 className="first-font text-2xl font-bold break-words w-full">{snapshot.name}</h1>

      {snapshot.link && (
        <NavLink to={snapshot.link} target="blank" className={buttonVariants() + " w-full mt-2"}>
          <Link />
          {t("recipe.toTheRecipe")}
        </NavLink>
      )}

      <Separator />

      {snapshot.description && (
        <p className="text-md font-medium mb-4 mt-2 whitespace-pre-wrap">{snapshot.description}</p>
      )}

      {/* Ingredients */}
      {displayIngredients.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mt-4">{t("ingredients.title")}</h2>

          {snapshot.base_servings && (
            <p className="text-sm text-muted-foreground mb-2">
              {snapshot.base_servings} {snapshot.servings_unit ?? t("ingredients.servings")}
            </p>
          )}

          {groupedIngredients.map((group, groupIndex) => (
            <div key={group.name ?? `group-${groupIndex}`}>
              {group.name && <h4 className="font-bold text-sm mt-4">{group.name}</h4>}
              <ul className="list-disc ml-4">
                {group.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className={`py-0.5 ${ingredient.isOptional ? "text-muted-foreground" : ""}`}
                  >
                    <span className="text-sm font-medium">
                      {ingredient.rawText}
                      {ingredient.isOptional && (
                        <span className="text-xs ml-1 text-muted-foreground">(optional)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Instructions — structured steps when present, legacy markdown otherwise */}
      {instructionsMarkdown && (
        <div>
          <h2 className="text-lg font-semibold mt-4 mb-1">{t("recipe.instructions")}</h2>
          <MarkdownRenderer content={instructionsMarkdown} className="font-medium" />
        </div>
      )}
    </Layout>
  );
}
