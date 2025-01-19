import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router";

type Recipe = {
  id: number;
  recipeName: string;
  description: string;
  link: string;
};

export default function Recipe() {
  const params = useParams();

  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    getRecipe();
  }, [params.recipeId]);

  async function getRecipe() {
    if (!params.recipeId) return;
    const { data } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", params.recipeId);

    if (!data) {
      setRecipe(null);
      return;
    }

    setRecipe({
      id: data[0].id,
      recipeName: data[0].name,
      description: data[0].description ?? "",
      link: data[0].link ?? "",
    });
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold">{recipe?.recipeName}</h1>

      <AspectRatio ratio={16 / 9} className="bg-muted">
        <img
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="by Drew Beamer"
          className="h-full w-full rounded-md object-cover"
        />
      </AspectRatio>

      <p className="font-bold">{recipe?.description}</p>

      <p>
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
      </p>

      <NavLink
        to={recipe?.link ?? "/discover"}
        className={buttonVariants({ variant: "outline" }) + " w-full mt-2"}
      >
        To the recipe
      </NavLink>

      <div className="flex gap-2 w-full mt-11">
        <Button className="w-full" variant="secondary">
          Save
        </Button>
        <Button className="w-full" disabled>
          Plan
        </Button>
      </div>
    </Layout>
  );
}
