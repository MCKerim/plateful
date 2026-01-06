import ShoppingItem from "@/components/atoms/ShoppingItem";
import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSupabase } from "@/utils/supabase";
import { getMealPlanningInfo, planRecipe } from "@/utils/mealPlanHelpers";
import { useEffect, useState, useRef } from "react";
import { NavLink, useParams, useNavigate } from "react-router";
import { MealPlanning, Recipes } from "@/types/exportedDatabaseTypes.types";
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

  const householdId = useAppSelector(selectHouseholdId);
  const currentUser = useAppSelector(selectUser);

  const ratingService = new RatingService(supabase);

  const [recipe, setRecipe] = useState<Recipes | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [lastMealPlan, setLastMealPlan] = useState<MealPlanning | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  const [ratings, setRatings] = useState<RecipeRatingWithUser[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const ratingModalRef = useRef<RatingModalRef>(null);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      if (globalThis.location.pathname.startsWith("/recipe/")) {
        globalThis.history.back();
      }
    };

    globalThis.addEventListener("popstate", handlePopState);

    return () => {
      globalThis.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!params.recipeId) return;
    const recipeId = Number.parseInt(params.recipeId);

    ratingService
      .getRatingsByRecipeId(recipeId)
      .then((data) => {
        setRatings(data);
        const avgRating = RatingService.calculateAverage(data);
        setAverageRating(avgRating);
      })
      .catch((error) => {
        console.error("Failed to load ratings:", error);
      });
  }, [params.recipeId]);

  useEffect(() => {
    async function getAllRecipeImages() {
      const { data, error } = await supabase.storage
        .from("recipeimages")
        .list(`recipe_${params.recipeId}/`);

      if (error) {
        console.error("Error fetching images: ", error);
        return;
      }

      if (data) {
        const urls = await Promise.all(
          data.map(async (file) => {
            const { data: signedUrlData, error: signedUrlError } =
              await supabase.storage
                .from("recipeimages")
                .createSignedUrl(
                  `recipe_${params.recipeId}/${file.name}`,
                  3600
                );

            if (signedUrlError) {
              console.error("Error creating signed URL: ", signedUrlError);
              return null;
            }

            return signedUrlData?.signedUrl;
          })
        );

        setImageUrls(urls.filter((url) => url !== null));
      }
    }

    getAllRecipeImages();
  }, [params.recipeId]);

  useEffect(() => {
    async function getRecipe() {
      if (!params.recipeId) return;
      const recipeId = Number.parseInt(params.recipeId);

      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId);

      if (!data) {
        setRecipe(null);
        return;
      }

      setRecipe(data[0]);
    }

    getRecipe();
  }, [params.recipeId]);

  useEffect(() => {
    async function getRecipeItems() {
      if (!recipe) return;

      const { data } = await supabase
        .from("recipe_items")
        .select(
          `
        id,
        recipe_id,
        amount,
        item ( id, name )
      `
        )
        .eq("recipe_id", recipe.id)
        .order("created_at", { ascending: false });

      const newRecipeItems: RecipeItem[] = [];

      if (!data) {
        setRecipeItems(newRecipeItems);
        return;
      }

      data.forEach((recipeItem) => {
        const newRecipeItem: RecipeItem = {
          id: recipeItem.item.id,
          itemName: recipeItem.item.name,
          amount: recipeItem.amount,
        };
        newRecipeItems.push(newRecipeItem);
      });
      console.log("Items: ", newRecipeItems);
      setRecipeItems(newRecipeItems);
    }

    getRecipeItems();
  }, [recipe]);

  async function addItemsToShoppingList() {
    console.log("Adding items to shopping list: ", recipeItems);
    const itemsToInsert = recipeItems.map((recipeItem) => ({
      shopping_list_id: 1,
      item_id: recipeItem.id,
      amount: recipeItem.amount,
      bought: false,
    }));

    const { error } = await supabase
      .from("shopping_list_items")
      .insert(itemsToInsert);

    if (error) {
      console.error("Error adding items to shopping list: ", error);
      alert("Error adding items to shopping list");
    } else {
      alert("Items added to shopping list");
    }
  }

  useEffect(() => {
    async function fetchMealPlanningInfo() {
      if (!params.recipeId) return;
      const recipeId = Number.parseInt(params.recipeId);

      const result = await getMealPlanningInfo(recipeId, supabase);

      if (result.error) {
        console.error("Error fetching meal planning info:", result.error);
        setLastMealPlan(null);
      } else {
        setLastMealPlan(result.data);
      }
    }

    fetchMealPlanningInfo();
  }, [params.recipeId]);

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
      navigate("/planner");
    } else {
      toast.error(t("recipe.planningFailed"), {
        position: "top-right",
        richColors: true,
      });
    }
  }

  async function handleDeleteRating(ratingId: number) {
    // Optimistically update UI
    const previousRatings = ratings;
    setRatings((prevRatings) => {
      const updatedRatings = prevRatings.filter((r) => r.id !== ratingId);
      const avgRating = RatingService.calculateAverage(updatedRatings);
      setAverageRating(avgRating);
      return updatedRatings;
    });

    try {
      await ratingService.deleteRating(ratingId);
    } catch (error) {
      // Revert on error
      console.error("Failed to delete rating:", error);
      alert(t("rating.deleteError"));
      setRatings(previousRatings);
      const avgRating = RatingService.calculateAverage(previousRatings);
      setAverageRating(avgRating);
    }
  }

  function handleEditRating(rating: RecipeRatingWithUser) {
    ratingModalRef.current?.open(rating);
  }

  function handleRatingSubmitted(newRating: RecipeRatingWithUser) {
    setRatings((prevRatings) => {
      const updatedRatings = [newRating, ...prevRatings];
      const avgRating = RatingService.calculateAverage(updatedRatings);
      setAverageRating(avgRating);
      return updatedRatings;
    });
  }

  function handleRatingUpdated(updatedRating: RecipeRatingWithUser) {
    setRatings((prevRatings) => {
      const updatedRatings = prevRatings.map((r) =>
        r.id === updatedRating.id ? updatedRating : r
      );
      const avgRating = RatingService.calculateAverage(updatedRatings);
      setAverageRating(avgRating);
      return updatedRatings;
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
          {recipe?.name}
        </h1>
      </div>

      {recipeItems.length > 0 && (
        <>
          <h2 className="mt-2 font-bold text-md">Ingredients</h2>

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
            Add items to shopping list
          </Button>
        </>
      )}

      <div className="flex justify-between">
        <div className="flex items-center gap-1">
          <CalendarDays size={16} />
          <p className="text-sm">{getMealPlanStatus(lastMealPlan, t)}</p>
        </div>

        <div className="flex items-center gap-0.5">
          <p className="text-sm">{formatRating(averageRating)}</p>
          <StarIcon style={{ fontSize: "16px" }} />
        </div>
      </div>

      {recipe?.link && (
        <NavLink to={recipe.link} className={buttonVariants() + " w-full mt-2"}>
          <Link />
          {t("recipe.toTheRecipe")}
        </NavLink>
      )}

      <Separator />

      <MarkdownRenderer
        content={recipe?.description || ""}
        className="font-medium"
      />

      <div>
        <Separator className="mb-2 mt-4" />

        <RatingModal
          ref={ratingModalRef}
          recipeId={recipe?.id}
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
