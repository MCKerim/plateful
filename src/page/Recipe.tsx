import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Pencil,
  Link,
  CalendarDays,
  ChefHat,
  Printer,
  Share2,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { IMAGE_COMPRESSION_OPTIONS } from "@/lib/constants";
import { useNativeCamera } from "@/hooks/general/useNativeCamera";
import { useSupabase } from "@/utils/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAppDispatch } from "@/redux/hooks";
import { resetChat, selectMessages, selectRecipeId } from "@/redux/slices/chatbotSlice";
import RatingModal, {
  RecipeRatingWithUser,
  RatingModalRef,
} from "@/components/general/RatingModal";
import StarIcon from "@mui/icons-material/Star";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { getMealPlanStatus } from "@/lib/mealPlanHelper/mealPlanHelper";
import MarkdownRenderer from "@/components/general/MarkdownRenderer";
import { formatRating } from "@/lib/formateRatingHelper/formatRatingHelper";
import { Separator } from "@/components/ui/separator";
import { PhotoProvider, PhotoView } from "react-photo-view";
import WeeklyPlanDialog from "@/components/general/WeeklyPlanDialog";
import { toast } from "sonner";
import RatingListItem from "@/components/general/RatingListItem";
import { useRecipe } from "@/hooks/recipe/useRecipe";
import { useRecipeImages } from "@/hooks/recipe/useRecipeImages";
import { useRecipeMealPlanInfo } from "@/hooks/meal-planning/useRecipeMealPlanInfo";
import { useRecipeRatings } from "@/hooks/ratings/useRecipeRatings";
import { useDeleteRating } from "@/hooks/ratings/useDeleteRating";
import RecipePageSkeleton from "@/components/recipe/RecipePageSkeleton";
import { useWakeLock } from "@/hooks/general/useWakeLock";
import { IngredientList } from "@/components/ingredients/IngredientList";
import { RecipePrintView } from "@/components/recipe/RecipePrintView";
import { useScaledIngredients } from "@/hooks/ingredients/useScaledIngredients";
import { selectTargetServings } from "@/redux/slices/servingsSlice";
import { useCreateRecipeShare } from "@/hooks/recipe/useCreateRecipeShare";
import { useDeleteRecipe } from "@/hooks/recipe/useDeleteRecipe";
import DeleteDialog from "@/components/general/DeleteDialog";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { Capacitor } from "@capacitor/core";

export default function Recipe() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector(selectUser);
  const chatMessages = useAppSelector(selectMessages);
  const chatRecipeId = useAppSelector(selectRecipeId);
  const recipeId = params.recipeId ?? null;

  const ratingModalRef = useRef<RatingModalRef>(null);

  // Reset scroll position when page opens or recipe changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [recipeId]);

  // Keep screen awake while viewing recipe (for cooking)
  useWakeLock();

  // Queries
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const { data: imageUrls = [] } = useRecipeImages(recipeId);
  const { data: lastMealPlan } = useRecipeMealPlanInfo(recipeId);
  const { ratings, averageRating } = useRecipeRatings(recipeId);
  const savedServings = useAppSelector((state) =>
    recipeId != null ? selectTargetServings(recipeId)(state) : undefined
  );
  const effectiveBaseServings = recipe?.base_servings ?? 1;
  const effectiveTargetServings = savedServings ?? effectiveBaseServings;
  const { data: scaledIngredients = [] } = useScaledIngredients(
    recipe ? recipeId : null,
    effectiveBaseServings,
    effectiveTargetServings
  );

  // Image upload (placeholder click)
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const { takePhoto, ImageSourceDrawerComponent } = useNativeCamera();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);

  // Mutations
  const deleteRatingMutation = useDeleteRating();
  const createShareMutation = useCreateRecipeShare();
  const deleteRecipeMutation = useDeleteRecipe();

  function handleDeleteRecipe() {
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

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      if (globalThis.location.pathname.startsWith("/recipe/")) {
        globalThis.history.back();
      }
    };
    globalThis.addEventListener("popstate", handlePopState);
    return () => globalThis.removeEventListener("popstate", handlePopState);
  }, []);

  function handleDeleteRating(ratingId: string) {
    if (!recipeId) return;

    deleteRatingMutation.mutate(
      { ratingId, recipeId },
      {
        onError: () => {
          toast.error(t("rating.deleteError"));
        },
      }
    );
  }

  function handleEditRating(rating: RecipeRatingWithUser) {
    ratingModalRef.current?.open(rating);
  }

  const canModifyRating = (rating: RecipeRatingWithUser): boolean => {
    return (currentUser && rating.owner_id === currentUser.id) || false;
  };

  function handlePrint() {
    setActionsDrawerOpen(false);
    setTimeout(() => {
      const prev = document.title;
      document.title = `Plateful - ${recipe?.name}`;
      window.print();
      window.onafterprint = () => {
        document.title = prev;
        window.onafterprint = null;
      };
    }, 350);
  }

  function handleAskChatbot() {
    if (!recipe) return;
    if (chatMessages.length > 0 && chatRecipeId === recipe.id) {
      navigate("/chatbot");
    } else {
      dispatch(resetChat());
      navigate(`/chatbot?recipeId=${recipe.id}`);
    }
  }

  async function handlePlaceholderClick() {
    if (!recipeId) return;

    let result: { file: File; dataUrl: string } | null = null;
    try {
      result = await takePhoto();
    } catch {
      toast.error(t("addRecipe.errors.uploadFailed"));
      return;
    }

    if (!result) return;

    setIsUploadingImage(true);
    try {
      const compressedFile = await imageCompression(result.file, IMAGE_COMPRESSION_OPTIONS);
      const fileExt = compressedFile.name.split(".").pop();
      const filePath = `recipe_${recipeId}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("recipeimages")
        .upload(filePath, compressedFile, { upsert: true });

      if (error) {
        toast.error(t("addRecipe.errors.uploadFailed") + ": " + error.message);
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.images(recipeId) });
    } catch {
      toast.error(t("addRecipe.errors.uploadFailed"));
    } finally {
      setIsUploadingImage(false);
    }
  }

  const saveFooter = (
    <>
      <div className="h-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex gap-2 border-border border-t-[1px]">
        <Button variant="secondary" className="w-full" onClick={handleAskChatbot}>
          <ChefHat style={{ transform: "rotate(16deg) translateY(-1px)" }} />
          {t("recipe.askChatbot")}
        </Button>

        {recipe && (
          <WeeklyPlanDialog
            recipeId={recipe.id}
            recipeName={recipe.name}
            navigateOnSuccess={true}
          />
        )}
      </div>
    </>
  );

  if (isLoading || !recipe) return <RecipePageSkeleton />;

  return (
    <Layout showHeader={false} showFooter={false} footer={saveFooter}>
      <div className="relative">
        {imageUrls.length === 0 ? (
          <AspectRatio ratio={16 / 9}>
            <div className="relative w-full h-full" onClick={handlePlaceholderClick}>
              <img
                src={"/no-img.jpg"}
                alt="Recipe"
                className="object-cover w-full h-full rounded-md dark:brightness-75 cursor-pointer"
              />
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          </AspectRatio>
        ) : (
          <PhotoProvider maskOpacity={0.5} bannerVisible={false}>
            <AspectRatio ratio={16 / 9}>
              {imageUrls.map((item, index) => (
                <PhotoView key={index} src={item}>
                  {index < 1 ? (
                    <img
                      src={item}
                      alt="Recipe"
                      className="object-cover w-full h-full rounded-md dark:brightness-75 cursor-pointer"
                    />
                  ) : undefined}
                </PhotoView>
              ))}
            </AspectRatio>
          </PhotoProvider>
        )}

        <div className="absolute top-1 right-1 z-10">
          <Button
            variant="ghost"
            className="text-white"
            size="icon"
            onClick={() => setActionsDrawerOpen(true)}
            aria-label="More actions"
          >
            <MoreVertical className="!size-5" />
          </Button>
        </div>

        <Drawer open={actionsDrawerOpen} onOpenChange={setActionsDrawerOpen}>
          <DrawerContent>
            <DrawerFooter className="gap-4 mb-8 mt-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setActionsDrawerOpen(false);
                  navigate(`/recipe/edit/${recipe?.id}`);
                }}
              >
                <div className="flex justify-start gap-4 w-full h-full items-center">
                  <Pencil />
                  <p className="second-font font-semibold">{t("recipe.editRecipe")}</p>
                </div>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  if (!recipe) return;
                  setActionsDrawerOpen(false);
                  createShareMutation.mutate(recipe.id);
                }}
                disabled={createShareMutation.isPending}
              >
                <div className="flex justify-start gap-4 w-full h-full items-center">
                  <Share2 />
                  <p className="second-font font-semibold">{t("share.shareRecipe")}</p>
                </div>
              </Button>

              {!Capacitor.isNativePlatform() && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handlePrint}
                >
                  <div className="flex justify-start gap-4 w-full h-full items-center">
                    <Printer />
                    <p className="second-font font-semibold">{t("recipe.printPdf")}</p>
                  </div>
                </Button>
              )}
              <DeleteDialog
                onDelete={handleDeleteRecipe}
                loading={deleteRecipeMutation.isPending}
                customTrigger={
                  <Button variant="secondary" size="lg" className="w-full">
                    <div className="flex justify-start gap-4 w-full h-full items-center">
                      <Trash2 />
                      <p className="second-font font-semibold">{t("common.delete")}</p>
                    </div>
                  </Button>
                }
              />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="flex justify-between">
        <h1 className="first-font text-2xl font-bold break-words w-full">{recipe.name}</h1>
      </div>

      <div className="flex justify-between mt-2">
        <div className="flex items-center gap-1">
          <CalendarDays size={16} />
          <p className="text-sm">{getMealPlanStatus(lastMealPlan ?? null, t)}</p>
        </div>

        <div className="flex items-center gap-0.5">
          <p className="text-sm">{formatRating(averageRating)}</p>
          <StarIcon style={{ fontSize: "16px" }} />
        </div>
      </div>

      {recipe.link && (
        <NavLink to={recipe.link} target="blank" className={buttonVariants() + " w-full mt-2"}>
          <Link />
          {t("recipe.toTheRecipe")}
        </NavLink>
      )}

      <Separator />

      {recipe.description && (
        <p className="text-md font-medium mb-4 mt-2 whitespace-pre-wrap">{recipe.description}</p>
      )}

      {/* Ingredients Section */}
      {scaledIngredients.length > 0 && (
        <IngredientList
          recipeId={recipe.id}
          baseServings={recipe.base_servings}
          servingsUnit={recipe.servings_unit ?? "servings"}
          showScalingControls={recipe.base_servings !== null}
        />
      )}

      {/* Instructions Section */}
      {recipe.instructions && (
        <div>
          <h2 className="text-lg font-semibold mt-4 mb-1">{t("recipe.instructions")}</h2>

          <MarkdownRenderer content={recipe.instructions} className="font-medium" />
        </div>
      )}

      <div>
        <Separator className="mb-2 mt-4" />

        <RatingModal ref={ratingModalRef} recipeId={recipe.id} />

        <h2 className="first-font text-xl font-bold mb-1">{t("recipe.ratings")}</h2>

        {ratings.length === 0 && <p>{t("recipe.noRatings")}</p>}

        {ratings.map((rating) => (
          <RatingListItem
            key={rating.id}
            canModify={canModifyRating(rating)}
            rating={rating}
            handleEditRating={handleEditRating}
            handleDeleteRating={handleDeleteRating}
          />
        ))}
      </div>

      <RecipePrintView
        recipe={recipe}
        imageUrl={imageUrls[0]}
        ingredients={scaledIngredients}
        targetServings={effectiveTargetServings}
        servingsUnit={recipe.servings_unit ?? undefined}
      />
      {ImageSourceDrawerComponent}
    </Layout>
  );
}
