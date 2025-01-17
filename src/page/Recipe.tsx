import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router";

export default function Recipe() {
  const params = useParams();

  return (
    <Layout>
      <h1 className="text-2xl font-bold">Spaghetti Carbonara {params.recipeId}</h1>

      <AspectRatio ratio={16 / 9} className="bg-muted">
        <img
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="by Drew Beamer"
          className="h-full w-full rounded-md object-cover"
        />
      </AspectRatio>

      <p className="font-bold">A classic Italian pasta dish</p>

      <p>
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
      </p>

      <div className="flex gap-2 w-full mt-11">
        <Button className="w-full" variant="secondary">
          Plan
        </Button>
        <Button className="w-full">Save</Button>
      </div>
    </Layout>
  );
}
