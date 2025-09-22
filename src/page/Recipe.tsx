import ShoppingItem from "@/components/atoms/ShoppingItem";
import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSupabase } from "@/utils/supabase";
import { useEffect, useState } from "react";
import { NavLink, useParams, useNavigate } from "react-router";
import {
  MealPlanning,
  RecipeRatings,
  Recipes,
} from "@/types/exportedDatabaseTypes.types";
import PlanDialog from "@/components/atoms/PlanDialog";
import { useTranslation } from "react-i18next";
import { Pencil, Link, CalendarDays } from "lucide-react";
import RatingModal from "@/components/atoms/RatingModal";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { getMealPlanStatus } from "@/lib/mealPlanHelper";
import MarkdownRenderer from "@/components/atoms/MarkdownRenderer";
import { formatRating } from "@/lib/formatRatingHelper";

type RecipeItem = {
  id: number;
  itemName: string;
  amount: string;
};

type RecipeRatingWithUser = RecipeRatings & {
  users: {
    email: string;
  };
};

export default function Recipe() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();

  const householdId = useAppSelector(selectHouseholdId);

  const [recipe, setRecipe] = useState<Recipes | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [lastMealPlan, setLastMealPlan] = useState<MealPlanning | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  const [ratings, setRatings] = useState<RecipeRatingWithUser[]>([]);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      if (window.location.pathname.startsWith("/recipe/")) {
        window.history.back();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!params.recipeId) return;
    const recipeId = parseInt(params.recipeId);

    supabase
      .from("recipe_ratings")
      .select("*, users(email)")
      .eq("recipe_id", recipeId)
      .then((response) => {
        if (response.data) {
          setRatings(response.data);

          const totalStars = response.data.reduce(
            (acc, rating) => acc + rating.stars,
            0
          );

          const avgStars =
            response.data.length > 0 ? totalStars / response.data.length : null;

          setAverageRating(avgStars);
        }
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

  function handleNextImage() {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
    );
  }

  function handlePreviousImage() {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1
    );
  }

  useEffect(() => {
    async function getRecipe() {
      if (!params.recipeId) return;
      const recipeId = parseInt(params.recipeId);

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

  async function planRecipe(id: number, newDate: Date | null, newDays: number) {
    if (!householdId) {
      return;
    }

    const { error } = await supabase.from("meal_planning").insert({
      recipe_id: id,
      planned_date: newDate?.toISOString(),
      days: newDays,
      household_id: householdId,
    });

    if (error) {
      console.error("Error while planning recipe: ", error);
      alert("Error while planning recipe");
    } else {
      navigate("/planner");
    }
  }

  useEffect(() => {
    async function getMealPlanningInfo() {
      if (!params.recipeId) return;
      const recipeId = parseInt(params.recipeId);

      const { data } = await supabase
        .from("meal_planning")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const latestPlan = data[0];
        setLastMealPlan(latestPlan);
      } else {
        setLastMealPlan(null);
      }
    }

    getMealPlanningInfo();
  }, [params.recipeId]);

  return (
    <Layout>
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">{recipe?.name}</h1>

        <NavLink
          to={`/recipe/edit/${recipe?.id}`}
          className="flex items-center pl-6"
        >
          <Pencil height={18} width={18} />
        </NavLink>
      </div>

      <AspectRatio ratio={16 / 9} className="-z-10">
        <img
          src={
            imageUrls.length > 0 ? imageUrls[currentImageIndex] : "/no-img.jpg"
          }
          alt="Recipe"
          className="object-cover w-full h-full rounded-md dark:brightness-75"
        />
      </AspectRatio>

      {imageUrls.length > 1 && (
        <div className="flex justify-between mt-2">
          <Button variant="secondary" onClick={handlePreviousImage}>
            Previous
          </Button>

          <Button variant="secondary" onClick={handleNextImage}>
            Next
          </Button>
        </div>
      )}

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

      {recipe && <PlanDialog id={recipe?.id} onUpdateDate={planRecipe} />}

      {recipe?.link && (
        <NavLink
          to={recipe.link}
          className={buttonVariants({ variant: "outline" }) + " w-full mt-2"}
        >
          <Link />

          {t("recipe.toTheRecipe")}
        </NavLink>
      )}

      <RatingModal recipeId={recipe?.id} />

      <MarkdownRenderer
        content={recipe?.description || ""}
        className="font-medium"
      />

      <div>
        <h2 className="text-xl font-bold border-t-2 mt-4 mb-1">Bewertungen</h2>

        {ratings.length === 0 && <p>Keine Bewertungen</p>}

        {ratings.map((rating) => {
          return (
            <div className="mb-6" key={rating.id}>
              <p>{rating.users.email}</p>

              <div>
                {Array.from({ length: 5 }, (_, index) => {
                  return index < rating.stars ? (
                    <StarIcon style={{ fontSize: "16px" }} />
                  ) : (
                    <StarBorderIcon style={{ fontSize: "16px" }} />
                  );
                })}
              </div>

              <p className="text-wrap break-words">{rating.note}</p>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
