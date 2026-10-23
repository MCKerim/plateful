import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Pencil,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  Folder,
  Printer,
  Share2,
  Sparkles,
  Star,
  Loader2,
  MoreHorizontal,
  ShoppingCart,
  Trash2,
  User,
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
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { selectHouseholdMembers } from "@/redux/slices/householdSlice";
import { getMealPlanStatus } from "@/lib/mealPlanHelper/mealPlanHelper";
import { formatRating } from "@/lib/formateRatingHelper/formatRatingHelper";
import { PhotoProvider, PhotoView } from "react-photo-view";
import WeeklyPlanDialog from "@/components/general/WeeklyPlanDialog";
import { toast } from "sonner";
import RatingListItem from "@/components/general/RatingListItem";
import { useRecipe } from "@/hooks/recipe/useRecipe";
import { useRecipeInstructions } from "@/hooks/instructions/useRecipeInstructions";
import { useRecipeImages } from "@/hooks/recipe/useRecipeImages";
import { useRecipeMealPlanInfo } from "@/hooks/meal-planning/useRecipeMealPlanInfo";
import { useRecipeRatings } from "@/hooks/ratings/useRecipeRatings";
import { useDeleteRating } from "@/hooks/ratings/useDeleteRating";
import RecipePageSkeleton from "@/components/recipe/RecipePageSkeleton";
import { useWakeLock } from "@/hooks/general/useWakeLock";
import { IngredientList } from "@/components/ingredients/IngredientList";
import InstructionSteps from "@/components/instructions/InstructionSteps";
import NutritionSection from "@/components/recipe/NutritionSection";
import SourceLinkButton from "@/components/recipe/SourceLinkButton";
import { RecipePrintView } from "@/components/recipe/RecipePrintView";
import { useScaledIngredients } from "@/hooks/ingredients/useScaledIngredients";
import { selectTargetServings } from "@/redux/slices/servingsSlice";
import { useCreateRecipeShare } from "@/hooks/recipe/useCreateRecipeShare";
import { useDeleteRecipe } from "@/hooks/recipe/useDeleteRecipe";
import DeleteDialog from "@/components/general/DeleteDialog";
import RecipeCollectionsDialog from "@/components/collections/RecipeCollectionsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Capacitor } from "@capacitor/core";
import { recipeImageApi } from "@/api/recipeImage.api";
import { useRecipeCookingState } from "@/hooks/cooking/useRecipeCookingState";
import { cn } from "@/lib/utils";
import { barButton, glass } from "@/components/recipe/glass";

export default function Recipe() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector(selectUser);
  const members = useAppSelector(selectHouseholdMembers);
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
  const { data: instructionSteps = [] } = useRecipeInstructions(recipeId);
  const { data: imageUrls = [] } = useRecipeImages(recipeId);
  const { data: lastMealPlan } = useRecipeMealPlanInfo(recipeId);
  const { ratings, averageRating } = useRecipeRatings(recipeId);
  const cookingState = useRecipeCookingState(recipeId);
  // One word per state, as on iOS: Cook, Cook along (a member's session),
  // Continue (one this user is in).
  const cookLabel =
    cookingState.kind === "mine"
      ? t("cooking.continue")
      : cookingState.kind === "joinable"
        ? t("cooking.cookAlong")
        : t("cooking.cook");
  // Ask and Plan drop their words when Cook's would be cut off, as iOS's
  // toolbar does: "Weiterkochen" doesn't fit next to them on a 360 px phone.
  const cookTextRef = useRef<HTMLSpanElement>(null);
  const [iconsOnlyFor, setIconsOnlyFor] = useState<string | null>(null);
  const iconsOnly = iconsOnlyFor === cookLabel;
  useLayoutEffect(() => {
    const text = cookTextRef.current;
    if (text && !iconsOnly && text.scrollWidth > text.clientWidth) setIconsOnlyFor(cookLabel);
  }, [cookLabel, iconsOnly, isLoading, instructionSteps.length]);
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

  const [addToListOpen, setAddToListOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  function handleBack() {
    // Opened from a link there is no in-app page to go back to.
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/cookbook");
  }

  function handlePrint() {
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
      await recipeImageApi.uploadCover(supabase, recipeId, compressedFile);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.recipes.images(recipeId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipeId) }),
      ]);
    } catch {
      toast.error(t("addRecipe.errors.uploadFailed"));
    } finally {
      setIsUploadingImage(false);
    }
  }

  // Ask and Plan opposite Cook, like the native bar (Ask stands where iOS has Adapt).
  const saveFooter = (
    <>
      <div className="h-[calc(4.5rem+env(safe-area-inset-bottom))]"></div>

      {/* No bar of its own: the page scrolls on under the capsules. */}
      <div className="pointer-events-none fixed bottom-0 z-20 flex w-full max-w-lg items-center gap-2 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className={cn(glass, "pointer-events-auto flex items-center")}>
          <Button
            variant="ghost"
            className={cn(barButton, "h-12 px-4 text-base [&_svg]:size-5")}
            onClick={handleAskChatbot}
          >
            <Sparkles />
            <span className={cn(iconsOnly && "sr-only")}>{t("recipe.ask")}</span>
          </Button>

          <Button
            variant="ghost"
            className={cn(barButton, "h-12 px-4 text-base [&_svg]:size-5")}
            onClick={() => setPlanOpen(true)}
          >
            <CalendarPlus />
            <span className={cn(iconsOnly && "sr-only")}>{t("recipe.plan")}</span>
          </Button>
        </div>

        <div className="flex-1" />

        {/* All three words open cooking mode; the session hook resolves
            fresh-vs-resume on the server. Only this button shrinks, so a
            word too long even next to bare icons ends in an ellipsis
            instead of running off the screen. */}
        {instructionSteps.length > 0 && (
          <Button
            className="pointer-events-auto h-12 min-w-0 rounded-full px-6 text-base font-semibold shadow-sm"
            onClick={() => navigate(`/cooking/${recipeId}`)}
          >
            <span ref={cookTextRef} className="truncate">
              {cookLabel}
            </span>
          </Button>
        )}
      </div>
    </>
  );

  if (isLoading) return <RecipePageSkeleton />;

  // Loaded and null: the recipe was deleted (likely by another household
  // member) while this link/tab was open — say so instead of skeleton-ing
  // forever (or, before `getById` moved to maybeSingle, crashing).
  if (!recipe)
    return (
      <Layout showHeader={false} showFooter={false}>
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
          <span className="text-lg font-semibold">{t("recipe.goneTitle")}</span>
          <span className="text-sm text-muted-foreground">{t("recipe.goneBody")}</span>
          <Button variant="secondary" className="mt-2" onClick={() => navigate(-1)}>
            {t("survey.back")}
          </Button>
        </div>
      </Layout>
    );

  const myRating = ratings.find((rating) => canModifyRating(rating)) ?? null;
  const planStatus =
    lastMealPlan && (lastMealPlan.activePlan || lastMealPlan.lastPlannedDate)
      ? getMealPlanStatus(lastMealPlan, t)
      : null;
  // Who added the recipe; no line in a one-person household or once they left.
  const adderName =
    members && members.length > 1 && recipe.owner_id
      ? recipe.owner_id === currentUser?.id
        ? t("recipe.you")
        : (members.find((member) => member.id === recipe.owner_id)?.username ?? null)
      : null;
  const addedOn = new Date(recipe.created_at).toLocaleDateString(i18n.resolvedLanguage, {
    dateStyle: "long",
  });

  return (
    <Layout showHeader={false} showFooter={false} footer={saveFooter} noTopPadding>
      {/* Sticky like iOS's navigation bar; only the capsules take taps, the page scrolls on between them. */}
      <div className="pointer-events-none sticky top-0 z-20 flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(glass, barButton, "pointer-events-auto")}
          onClick={handleBack}
          aria-label={t("recipe.back")}
        >
          <ChevronLeft className="!size-6" />
        </Button>

        {/* Sharing sits outside the menu, left of the dots, the way the
            native iOS app has it — one tap instead of two. */}
        <div className={cn(glass, "pointer-events-auto flex items-center")}>
          <Button
            variant="ghost"
            size="icon"
            className={barButton}
            onClick={() => createShareMutation.mutate(recipe.id)}
            disabled={createShareMutation.isPending}
            aria-label={t("share.shareRecipe")}
          >
            {createShareMutation.isPending ? (
              <Loader2 className="!size-5 animate-spin" />
            ) : (
              <Share2 className="!size-5" />
            )}
          </Button>

          {/* Not modal: a modal menu and the dialog its item opens fight over body's pointer lock. */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={barButton}
                aria-label={t("recipe.moreActions")}
              >
                <MoreHorizontal className="!size-6" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem className="py-2.5 text-base" onSelect={() => setPlanOpen(true)}>
                <CalendarPlus />
                {t("recipe.plan")}
              </DropdownMenuItem>

              {scaledIngredients.length > 0 && (
                <DropdownMenuItem className="py-2.5 text-base" onSelect={() => setAddToListOpen(true)}>
                  <ShoppingCart />
                  {t("shoppingList.addToList")}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="py-2.5 text-base"
                onSelect={() => navigate(`/recipe/edit/${recipe.id}`, { replace: true })}
              >
                <Pencil />
                {t("common.edit")}
              </DropdownMenuItem>

              <DropdownMenuItem className="py-2.5 text-base" onSelect={() => setCollectionsOpen(true)}>
                <Folder />
                {t("collections.collections")}
              </DropdownMenuItem>

              {!Capacitor.isNativePlatform() && (
                <DropdownMenuItem className="py-2.5 text-base" onSelect={handlePrint}>
                  <Printer />
                  {t("recipe.printPdf")}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="py-2.5 text-base text-destructive focus:text-destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <AspectRatio ratio={4 / 3}>
          {imageUrls.length === 0 ? (
            <div className="relative w-full h-full" onClick={handlePlaceholderClick}>
              <img
                src={"/no-img.jpg"}
                alt="Recipe"
                className="object-cover w-full h-full rounded-[28px] dark:brightness-75 cursor-pointer"
              />
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[28px]">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <PhotoProvider maskOpacity={0.5} bannerVisible={false}>
              {imageUrls.map((item, index) => (
                <PhotoView key={index} src={item}>
                  {index < 1 ? (
                    <img
                      src={item}
                      alt="Recipe"
                      className="object-cover w-full h-full rounded-[28px] dark:brightness-75 cursor-pointer"
                    />
                  ) : undefined}
                </PhotoView>
              ))}
            </PhotoProvider>
          )}
        </AspectRatio>

        <div className="flex flex-col gap-3">
          <h1 className="first-font text-2xl font-bold break-words w-full">{recipe.name}</h1>

          {(recipe.link || averageRating !== null) && (
            <div className="flex items-center justify-between gap-2">
              {recipe.link ? <SourceLinkButton link={recipe.link} /> : <span />}

              {averageRating !== null && (
                <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                  <Star className="size-4 fill-current" />
                  {formatRating(averageRating)}
                </span>
              )}
            </div>
          )}

          {(planStatus || adderName) && (
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              {planStatus ? (
                <button
                  type="button"
                  className="flex items-center gap-1.5"
                  onClick={() => setPlanOpen(true)}
                >
                  <CalendarDays className="size-4" />
                  {planStatus}
                </button>
              ) : (
                <span />
              )}

              {adderName && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5"
                      aria-label={
                        recipe.owner_id === currentUser?.id
                          ? t("recipe.addedByYou")
                          : t("recipe.addedBy", { name: adderName })
                      }
                    >
                      <User className="size-4" />
                      {adderName}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto px-4 py-3 text-sm">
                    {t("recipe.addedOn", { date: addedOn })}
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}

          {recipe.description && (
            <p className="text-base text-muted-foreground whitespace-pre-wrap">{recipe.description}</p>
          )}
        </div>

        {/* Nutrition Section (per serving; hidden when nothing calculated and
            no estimate is running — nutrition_pending pulses until the worker's
            values arrive via Realtime → refetch) */}
        <NutritionSection
          nutrition={{
            calories_kcal: recipe.calories_kcal,
            carbs_g: recipe.carbs_g,
            protein_g: recipe.protein_g,
            fat_g: recipe.fat_g,
            sugar_g: recipe.sugar_g,
            fiber_g: recipe.fiber_g,
            sodium_mg: recipe.sodium_mg,
          }}
          isPending={recipe.nutrition_pending}
        />

        {scaledIngredients.length > 0 && (
          <IngredientList
            recipeId={recipe.id}
            recipeName={recipe.name}
            baseServings={recipe.base_servings}
            servingsUnit={recipe.servings_unit ?? "servings"}
            showScalingControls={recipe.base_servings !== null}
            addToListOpen={addToListOpen}
            onAddToListOpenChange={setAddToListOpen}
          />
        )}

        {instructionSteps.length > 0 && <InstructionSteps steps={instructionSteps} />}

        <section className="flex flex-col gap-4 pt-1">
          <Button
            variant="secondary"
            className="h-12 rounded-full font-semibold"
            onClick={() => ratingModalRef.current?.open(myRating ?? undefined)}
          >
            <Star />
            {myRating ? t("rating.editYourRating") : t("rating.rateThisRecipe")}
          </Button>

          {ratings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3">{t("recipe.ratings")}</h2>

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
          )}
        </section>
      </div>

      <RatingModal ref={ratingModalRef} recipeId={recipe.id} />

      <WeeklyPlanDialog
        subject={{ kind: "recipe", id: recipe.id, name: recipe.name, tags: recipe.tags }}
        open={planOpen}
        onOpenChange={setPlanOpen}
        trigger={null}
        navigateOnSuccess={true}
      />

      <RecipeCollectionsDialog
        recipeId={recipe.id}
        householdId={recipe.household_id}
        open={collectionsOpen}
        onOpenChange={setCollectionsOpen}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={handleDeleteRecipe}
        loading={deleteRecipeMutation.isPending}
      />

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
