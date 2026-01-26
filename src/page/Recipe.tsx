import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Pencil, Link, CalendarDays, Bot } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { resetChat } from "@/redux/slices/chatbotSlice";
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

export default function Recipe() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector(selectUser);
  const recipeId = params.recipeId ? Number.parseInt(params.recipeId) : null;

  const ratingModalRef = useRef<RatingModalRef>(null);

  // Queries
  const { data: recipe } = useRecipe(recipeId);
  const { data: imageUrls = [] } = useRecipeImages(recipeId);
  const { data: lastMealPlan } = useRecipeMealPlanInfo(recipeId);
  const { ratings, averageRating } = useRecipeRatings(recipeId);

  // Mutations
  const deleteRatingMutation = useDeleteRating();

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

  function handleDeleteRating(ratingId: number) {
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

  function handleAskChatbot() {
    if (!recipe) return;
    dispatch(resetChat());
    navigate(`/chatbot?recipeId=${recipe.id}`);
  }

  const saveFooter = (
    <>
      <div className="h-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex gap-2 border-border border-t-[1px]">
        <Button variant="secondary" className="w-full" onClick={handleAskChatbot}>
          <Bot />
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

  if (!recipe) return null;

  return (
    <Layout showHeader={false} showFooter={false} footer={saveFooter}>
      <div className="relative">
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

        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 z-10"
          onClick={() => navigate(`/recipe/edit/${recipe?.id}`)}
          aria-label="Edit Recipe"
        >
          <Pencil size={18} />
        </Button>
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
        <NavLink to={recipe.link} className={buttonVariants() + " w-full mt-2"}>
          <Link />
          {t("recipe.toTheRecipe")}
        </NavLink>
      )}

      <Separator />

      <MarkdownRenderer content={recipe.description || ""} className="font-medium" />

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
    </Layout>
  );
}
