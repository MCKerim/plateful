import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout/Layout";

/** The recipe page's shape while it loads: top bar, 4:3 cover, title, meta rows, text, ingredients. */
export default function RecipePageSkeleton() {
  return (
    <Layout showHeader={false} showFooter={false} noTopPadding>
      <div className="h-12" />

      <div className="flex flex-col gap-4">
        <AspectRatio ratio={4 / 3}>
          <Skeleton className="w-full h-full rounded-[28px]" />
        </AspectRatio>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-3/4" />

          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-12" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    </Layout>
  );
}
