import MealPlannerItem from "@/components/atoms/MealPlannerItem";
import Layout from "@/components/layout/Layout";

export default function MealPlanner() {


  return (
    <Layout>
      <h1 className="text-2xl">Meal Planner</h1>
      <MealPlannerItem id={2} recipeName="Apfelmus" date="20.03.2000" />
      <MealPlannerItem id={2} recipeName="Apfelmus" date="20.03.2000" />
      <MealPlannerItem id={2} recipeName="Apfelmus" date="20.03.2000" />
    </Layout>
  );
}
