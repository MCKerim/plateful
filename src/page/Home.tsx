import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Donut, House, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router";
import { useMemo } from "react";
import { isSameDay } from "date-fns";
import { useMealPlannerItems } from "@/hooks/meal-planning/useMealPlannerItems";
import { useRecipes } from "@/hooks/cookbook/useRecipes";
import RecipeCard from "@/components/general/RecipeCard";
import TodaysMealCard from "@/components/home/TodaysMealCard";
import AddNewRecipeDrawer from "@/components/general/AddRecipeDrawer";
import GettingStartedCard from "@/components/home/GettingStartedCard";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();


  const today = useMemo(() => new Date(), []);
  const { data: currentWeekItems = [] } = useMealPlannerItems(today);

  // Fetch recipes for "recently added" section
  const { data: recipes = [] } = useRecipes();

  const todaysMeals = useMemo(
    () =>
      currentWeekItems
        .filter((item) => item.planned_date && isSameDay(item.planned_date, today))
        .sort((a, b) => (a.recipeCategory ?? 999) - (b.recipeCategory ?? 999)),
    [currentWeekItems, today]
  );

  const recentlyAddedRecipes = useMemo(() => {
    const importing = recipes.filter((r) => r.status === "importing");
    const ready = recipes
      .filter((r) => r.status === "ready")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6);
    return [...importing, ...ready];
  }, [recipes]);

  function handleURLImportClicked() {
    navigate("/urlImport");
  }

  function handleImageImportClicked() {
    navigate("/imageImport");
  }

  function handleAddRecipe() {
    navigate("/recipe/add");
  }

  return (
    <Layout
      headerButtons={
        <NavLink to="/householdSettings">
          <Button variant="ghost" size="icon">
            <House />
          </Button>
        </NavLink>
      }
    >
      {/* Getting started */}
      <div className="mt-4">
        <GettingStartedCard />
      </div>

      {/* Today's planned meals */}
      <div className="mb-36">
        {todaysMeals.length > 0 ? (
          <>
            <h2 className="second-font text-lg font-semibold">{t("home.todayYouPlanned")}</h2>

            <div className="flex flex-col gap-2">
              {todaysMeals.map((item) => (
                <TodaysMealCard
                  key={item.id}
                  id={item.id}
                  recipeId={item.recipeId}
                  recipeName={item.recipeName}
                  recipeCategory={item.recipeCategory}
                  eaten={item.eaten}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <h2 className="second-font text-lg font-bold">{t("home.nothingPlannedToday")}</h2>

            <NavLink to="/planner">
              <Button variant="outline">
                <CalendarDays />

                {t("home.goToPlanner")}
              </Button>
            </NavLink>
          </div>
        )}
      </div>

      {/* Recently added recipes */}
      {recentlyAddedRecipes.length > 0 && (
        <div>
          <h2 className="second-font text-lg font-semibold">{t("cookbook.recentlyAdded")}</h2>

          <div className="grid grid-cols-2 gap-2">
            {recentlyAddedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                name={recipe.recipeName}
                averageRating={recipe.avg_rating}
                status={recipe.status}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggest a feature */}
      <div className="mt-6 mb-40">
        <NavLink data-canny-link to="https://plateful.canny.io/support" target="blank">
          <Button variant="accent" className="w-full">
            <Donut size={24} />

            {t("settings.suggestFeatureOrReportBug")}
          </Button>
        </NavLink>
      </div>

      {/* Add recipe FAB */}
      <AddNewRecipeDrawer
        urlImportClicked={handleURLImportClicked}
        imageImportClicked={handleImageImportClicked}
        newRecipeClicked={handleAddRecipe}
      />
    </Layout>
  );
}
