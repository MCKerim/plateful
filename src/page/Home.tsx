import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import { selectHousehold } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { Donut, House, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router";
import { useMemo } from "react";
import { isSameDay } from "date-fns";
import { useMealPlannerItems } from "@/hooks/meal-planning/useMealPlannerItems";
import { useRecipes } from "@/hooks/cookbook/useRecipes";
import RecipeCard from "@/components/general/RecipeCard";
import AddNewRecipeDrawer from "@/components/general/AddRecipeDrawer";
import PlannedMealCard from "@/components/home/PlannedMealCard";
import { getGreetingKey } from "@/lib/greetingHelper/greetingHelper";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const household = useAppSelector(selectHousehold);

  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  // Fetch current and next week's meal plans (next week needed when today is Sunday)
  const nextWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }, []);
  const { data: currentWeekItems = [] } = useMealPlannerItems(today);
  const { data: nextWeekItems = [] } = useMealPlannerItems(nextWeek);
  const allPlannedItems = useMemo(
    () => [...currentWeekItems, ...nextWeekItems],
    [currentWeekItems, nextWeekItems]
  );

  // Fetch recipes for "recently added" section
  const { data: recipes = [] } = useRecipes();

  const todaysMeals = useMemo(
    () =>
      allPlannedItems.filter(
        (item) => item.planned_date && isSameDay(item.planned_date, today)
      ),
    [allPlannedItems, today]
  );

  const tomorrowsMeals = useMemo(
    () =>
      allPlannedItems.filter(
        (item) => item.planned_date && isSameDay(item.planned_date, tomorrow)
      ),
    [allPlannedItems, tomorrow]
  );

  const recentlyAddedRecipes = useMemo(() => {
    const importing = recipes.filter((r) => r.status === "importing");
    const ready = recipes
      .filter((r) => r.status === "ready")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 4);
    return [...importing, ...ready];
  }, [recipes]);

  const greetingKey = getGreetingKey(new Date().getHours());

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
    <Layout>
      {/* Household name */}
      <NavLink to="/householdSettings">
        <div className="flex items-center gap-1.5">
          <House size={18} />

          <span className="second-font text-sm text-muted-foreground font-semibold">
            {household?.name}
          </span>
        </div>
      </NavLink>

      {/* Time-based greeting */}
      <h1 className="first-font text-3xl mt-1">
        {t(greetingKey, { username: user?.username })}
      </h1>

      {/* Today's planned meals */}
      <div className="mt-4">
        <h2 className="second-font text-lg font-bold mb-2">
          {t("home.todayYouPlanned")}
        </h2>

        {todaysMeals.length > 0 ? (
          <div className="flex flex-col gap-2">
            {todaysMeals.map((item) => (
              <PlannedMealCard
                key={item.id}
                recipeId={item.recipeId}
                recipeName={item.recipeName}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <p className="text-sm text-muted-foreground italic">
              {t("home.nothingPlannedToday")}
            </p>

            <NavLink to="/planner">
              <Button variant="outline" size="sm">
                <CalendarDays size={16} />
                {t("home.goToPlanner")}
              </Button>
            </NavLink>
          </div>
        )}
      </div>

      {/* Tomorrow's planned meals (only if any) */}
      {tomorrowsMeals.length > 0 && (
        <div className="mt-4">
          <h2 className="second-font text-lg font-bold mb-2">
            {t("home.tomorrow")}
          </h2>

          <div className="flex flex-col gap-2">
            {tomorrowsMeals.map((item) => (
              <PlannedMealCard
                key={item.id}
                recipeId={item.recipeId}
                recipeName={item.recipeName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently added recipes */}
      {recentlyAddedRecipes.length > 0 && (
        <div className="mt-6">
          <h2 className="second-font text-lg font-bold mb-2">
            {t("cookbook.recentlyAdded")}
          </h2>

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
      <div className="mt-6 mb-4">
        <NavLink
          data-canny-link
          to="https://plateful.canny.io/support"
          target="blank"
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
          >
            <Donut size={16} />
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
