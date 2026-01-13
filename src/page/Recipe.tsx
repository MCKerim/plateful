import ShoppingItem from "@/components/atoms/ShoppingItem";
import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSupabase } from "@/utils/supabase";
import { getMealPlanningInfo, planRecipe } from "@/utils/mealPlanHelpers";
import { useEffect, useRef, useState } from "react";
import { NavLink, useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Pencil, Link, CalendarDays } from "lucide-react";
import RatingModal, {
  RecipeRatingWithUser,
  RatingModalRef,
} from "@/components/atoms/RatingModal";
import StarIcon from "@mui/icons-material/Star";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { getMealPlanStatus } from "@/lib/mealPlanHelper";
import MarkdownRenderer from "@/components/atoms/MarkdownRenderer";
import { formatRating } from "@/lib/formatRatingHelper";
import { Separator } from "@/components/ui/separator";
import { PhotoProvider, PhotoView } from "react-photo-view";
import WeeklyPlanDialog from "@/components/atoms/WeeklyPlanDialog";
import { toast } from "sonner";
import { RatingService } from "@/lib/services/ratingService";
import RatingListItem from "@/components/atoms/RatingListItem";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type RecipeItem = {
  id: number;
  itemName: string;
  amount: string;
};

export default function Recipe() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const householdId = useAppSelector(selectHouseholdId);
  const currentUser = useAppSelector(selectUser);
  const recipeId = params.recipeId ? Number.parseInt(params.recipeId) : null;

  const ratingService = new RatingService(supabase);
  const ratingModalRef = useRef<RatingModalRef>(null);

  // Local state for ratings to allow instant UI updates (optimistic)
  const [ratings, setRatings] = useState<RecipeRatingWithUser[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  // --- REACT QUERY HOOKS ---

  // 1. Fetch Recipe Details
  const { data: recipe } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      if (!recipeId) return null;
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();
      return data;
    },
    enabled: !!recipeId,
  });

  // 2. Fetch Recipe Items (Ingredients)
  const { data: recipeItems = [] } = useQuery({
    queryKey: ["recipe-items", recipeId],
    queryFn: async () => {
      if (!recipeId) return [];
      const { data } = await supabase
        .from("recipe_items")
        .select(`id, recipe_id, amount, item ( id, name )`)
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false });

      return (data || []).map((item) => ({
        id: item.item.id,
        itemName: item.item.name,
        amount: item.amount,
      }));
    },
    enabled: !!recipeId,
  });

  // 3. Fetch Images
  const { data: imageUrls = [] } = useQuery({
    queryKey: ["recipe-images", recipeId],
    queryFn: async () => {
      if (!recipeId) return [];
      const { data, error } = await supabase.storage
        .from("recipeimages")
        .list(`recipe_${recipeId}/`);

      if (error || !data) return [];

      const urls = await Promise.all(
        data.map(async (file) => {
          const { data: signedUrlData } = await supabase.storage
            .from("recipeimages")
            .createSignedUrl(`recipe_${recipeId}/${file.name}`, 3600);
          return signedUrlData?.signedUrl || null;
        })
      );
      return urls.filter((url): url is string => url !== null);
    },
    enabled: !!recipeId,
  });

  // 4. Fetch Meal Planning Info
  const { data: lastMealPlan } = useQuery({
    queryKey: ["meal-planning-info", recipeId],
    queryFn: async () => {
      if (!recipeId) return null;
      const result = await getMealPlanningInfo(recipeId, supabase);
      return result.data || null;
    },
    enabled: !!recipeId,
  });

  // 5. Fetch Ratings (Initial Load)
  useQuery({
    queryKey: ["ratings", recipeId],
    queryFn: async () => {
      if (!recipeId) return [];
      const data = await ratingService.getRatingsByRecipeId(recipeId);
      setRatings(data);
      setAverageRating(RatingService.calculateAverage(data));
      return data;
    },
    enabled: !!recipeId,
    // We only fetch once on mount to populate local state
    staleTime: 1000 * 60 * 5,
  });

  // --- EFFECTS ---

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

  // --- ACTIONS ---

  async function addItemsToShoppingList() {
    const itemsToInsert = recipeItems.map((recipeItem) => ({
      shopping_list_id: 1, // You might want to get this dynamically
      item_id: recipeItem.id,
      amount: recipeItem.amount,
      bought: false,
    }));

    const { error } = await supabase
      .from("shopping_list_items")
      .insert(itemsToInsert);

    if (error) {
      console.error("Error adding items: ", error);
      toast.error(t("common.error"));
    } else {
      toast.success(t("shoppingList.addedSuccess"));
    }
  }

  async function finishPlanning(dates: Date[]) {
    if (!recipe || !householdId) return;

    let isSuccess = false;

    if (dates.length === 0) {
      const result = await planRecipe(
        recipe.id,
        householdId,
        null,
        1,
        supabase
      );
      isSuccess = result?.success;
    } else {
      const planningPromises = dates.map((date) =>
        planRecipe(recipe.id, householdId, date, 1, supabase)
      );
      const results = await Promise.all(planningPromises);
      isSuccess = results.every((res) => res?.success);
    }

    if (isSuccess) {
      toast.success(t("recipe.planningSuccessful"), {
        position: "top-right",
        richColors: true,
      });

      // KEY FIX: Invalidate queries so the dialog and planner page update instantly
      queryClient.invalidateQueries({ queryKey: ["meal-planning"] });
      queryClient.invalidateQueries({ queryKey: ["meal-planning-info"] });

      navigate("/planner");
    } else {
      toast.error(t("recipe.planningFailed"), {
        position: "top-right",
        richColors: true,
      });
    }
  }

  // --- RATING HANDLERS (Optimistic UI) ---

  async function handleDeleteRating(ratingId: number) {
    const previousRatings = ratings;
    setRatings((prev) => {
      const updated = prev.filter((r) => r.id !== ratingId);
      setAverageRating(RatingService.calculateAverage(updated));
      return updated;
    });

    try {
      await ratingService.deleteRating(ratingId);
    } catch (error) {
      console.error("Failed to delete rating:", error);
      toast.error(t("rating.deleteError"));
      setRatings(previousRatings);
      setAverageRating(RatingService.calculateAverage(previousRatings));
    }
  }

  function handleEditRating(rating: RecipeRatingWithUser) {
    ratingModalRef.current?.open(rating);
  }

  function handleRatingSubmitted(newRating: RecipeRatingWithUser) {
    setRatings((prev) => {
      const updated = [newRating, ...prev];
      setAverageRating(RatingService.calculateAverage(updated));
      return updated;
    });
  }

  function handleRatingUpdated(updatedRating: RecipeRatingWithUser) {
    setRatings((prev) => {
      const updated = prev.map((r) =>
        r.id === updatedRating.id ? updatedRating : r
      );
      setAverageRating(RatingService.calculateAverage(updated));
      return updated;
    });
  }

  const canModifyRating = (rating: RecipeRatingWithUser): boolean => {
    return (currentUser && rating.owner_id === currentUser.id) || false;
  };

  const saveFooter = (
    <>
      <div className="h-[100px]"></div>
      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex gap-2 border-border border-t-[1px]">
        <NavLink
          to={`/recipe/edit/${recipe?.id}`}
          className={buttonVariants({ variant: "secondary" }) + " w-full"}
        >
          <Pencil />
          {t("recipe.editRecipe")}
        </NavLink>

        {recipe && <WeeklyPlanDialog onFinish={finishPlanning} />}
      </div>
    </>
  );

  if (!recipe) return null; // Or a loading spinner

  return (
    <Layout showHeader={false} showFooter={false} footer={saveFooter}>
      {imageUrls.length === 0 ? (
        <AspectRatio ratio={16 / 9}>
          <img
            src={"/no-img.jpg"}
            alt="Recipe"
            className="object-cover w-full h-full rounded-md dark:brightness-75 cursor-pointer"
          />
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

      <div className="flex justify-between">
        <h1 className="first-font text-2xl font-bold break-words w-full">
          {recipe.name}
        </h1>
      </div>

      {recipeItems.length > 0 && (
        <>
          <h2 className="mt-2 font-bold text-md">{t("recipe.ingredients")}</h2>
          {recipeItems.map((recipeItem, index) => (
            <ShoppingItem
              key={"item-" + index}
              id={recipeItem.id}
              name={recipeItem.itemName}
              amount={recipeItem.amount}
              bought={false}
              onClick={() => {}}
              onEdit={() => {}}
            />
          ))}
          <Button
            className="w-full"
            variant="secondary"
            onClick={addItemsToShoppingList}
          >
            {t("shoppingList.addItems")}
          </Button>
        </>
      )}

      <div className="flex justify-between mt-2">
        <div className="flex items-center gap-1">
          <CalendarDays size={16} />
          <p className="text-sm">{lastMealPlan && getMealPlanStatus(lastMealPlan, t)}</p>
        </div>

        <div className="flex items-center gap-0.5">
          <p className="text-sm">{formatRating(averageRating)}</p>
          <StarIcon style={{ fontSize: "16px" }} />
        </div>
      </div>

      {recipe.link && (
        <NavLink to={recipe.link} className={buttonVariants() + " w-full mt-2"}>
          <Link />
          {t("recipe.toTheRecipe")}
        </NavLink>
      )}

      <Separator />

      <MarkdownRenderer
        content={recipe.description || ""}
        className="font-medium"
      />

      <div>
        <Separator className="mb-2 mt-4" />

        <RatingModal
          ref={ratingModalRef}
          recipeId={recipe.id}
          ratingSubmittedCallback={handleRatingSubmitted}
          ratingUpdatedCallback={handleRatingUpdated}
        />

        <h2 className="first-font text-xl font-bold mb-1">
          {t("recipe.ratings")}
        </h2>

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
    </Layout>
  );
}
