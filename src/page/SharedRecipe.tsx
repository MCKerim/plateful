import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
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
import type { SnapshotIngredient } from "@/types/recipeShare.types";
import type { RecipeIngredient } from "@/types/ingredient.types";
import { toast } from "sonner";
import { Download, BookmarkPlus } from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/app/plateful/id6740278718";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.kblanks.plateful";

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
          navigate(`/recipe/${newRecipeId}`);
        },
        onError: () => {
          toast.error(t("share.importError"));
        },
      }
    );
  }

  function handleDownloadApp() {
    const url =
      Capacitor.getPlatform() === "android"
        ? PLAY_STORE_URL
        : APP_STORE_URL;
    window.open(url, "_blank");
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
    return (
      <Layout showFooter={false}>
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <p className="text-lg font-semibold">{t("share.notFound")}</p>
          <p className="text-muted-foreground">{t("share.notFoundDescription")}</p>
        </div>
      </Layout>
    );
  }

  const { snapshot } = share;
  const displayIngredients = snapshot.ingredients.map(toDisplayIngredient);
  const groupedIngredients = groupIngredients(displayIngredients);

  const saveButton = isLoggedIn && householdId ? (
    <Button
      className="w-full"
      onClick={handleSave}
      disabled={importMutation.isPending}
    >
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

  const loginButton =
    isNative && !isLoggedIn ? (
      <Button className="w-full" onClick={() => navigate("/signup")}>
        {t("share.loginToSave")}
      </Button>
    ) : null;

  const footer = (
    <>
      <div className="h-[80px]" />
      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex flex-col gap-2 border-border border-t-[1px]">
        {saveButton}
        {loginButton}
        {downloadButton}
      </div>
    </>
  );

  return (
    <Layout showHeader={false} showFooter={false} footer={footer}>
      {/* Image gallery */}
      {snapshot.image_urls.length === 0 ? (
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
            {snapshot.image_urls.map((url, index) => (
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

      {/* Shared-by banner */}
      <div className="mt-1 text-xs text-muted-foreground">{t("share.sharedRecipeBadge")}</div>

      <h1 className="first-font text-2xl font-bold break-words w-full">{snapshot.name}</h1>

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
              {group.name && (
                <h4 className="font-bold text-sm mt-4">{group.name}</h4>
              )}
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

      {/* Instructions */}
      {snapshot.instructions && (
        <div>
          <h2 className="text-lg font-semibold mt-4 mb-1">{t("recipe.instructions")}</h2>
          <MarkdownRenderer content={snapshot.instructions} className="font-medium" />
        </div>
      )}
    </Layout>
  );
}
