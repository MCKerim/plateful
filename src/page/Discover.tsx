import RecipeCard from "@/components/atoms/RecipeCard";
import Layout from "@/components/layout/Layout";

export default function Discover() {
  return (
    <Layout>
      <h1 className="text-2xl">Discover</h1>

      <div className="flex flex-col gap-2 items-center">
        <RecipeCard
          name="Spaghetti Carbonara"
          description="A classic Italian pasta dish."
        />
        <RecipeCard
          name="Spaghetti Carbonara"
          description="A classic Italian pasta dish."
        />
        <RecipeCard
          name="Spaghetti Carbonara"
          description="A classic Italian pasta dish."
        />
        <RecipeCard
          name="Spaghetti Carbonara"
          description="A classic Italian pasta dish."
        />
        <RecipeCard
          name="Spaghetti Carbonara"
          description="A classic Italian pasta dish."
        />
      </div>
    </Layout>
  );
}
