import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { buttonVariants } from "@/components/ui/button";
import { useSupabase } from "@/utils/supabase";
import { getMealPlanningInfo, planRecipe } from "@/utils/mealPlanHelpers";
import { useEffect, useRef, useState } from "react";
import { NavLink, useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Pencil, Link, CalendarDays } from "lucide-react";
import RatingModal, {
  RecipeRatingWithUser,
  RatingModalRef,
} from "@/components/general/RatingModal";
import StarIcon from "@mui/icons-material/Star";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { getMealPlanStatus } from "@/lib/mealPlanHelper";
import MarkdownRenderer from "@/components/general/MarkdownRenderer";
import { formatRating } from "@/lib/formatRatingHelper";
import { Separator } from "@/components/ui/separator";
import { PhotoProvider, PhotoView } from "react-photo-view";
import WeeklyPlanDialog from "@/components/general/WeeklyPlanDialog";
import { toast } from "sonner";
import { RatingService } from "@/lib/services/ratingService";
import RatingListItem from "@/components/general/RatingListItem";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

  const [ratings, setRatings] = useState<RecipeRatingWithUser[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);

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

  const { data: lastMealPlan } = useQuery({
    queryKey: ["meal-planning-info", recipeId],
    queryFn: async () => {
      if (!recipeId) return null;
      const result = await getMealPlanningInfo(recipeId, supabase);
      return result.data || null;
    },
    enabled: !!recipeId,
  });

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
    staleTime: 1000 * 60 * 5,
  });

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
