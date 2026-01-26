import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/layout/Layout";

function RatingItemSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-4 w-20 mt-1" />
      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-3/4 mt-1" />
    </div>
  );
}

export default function RecipePageSkeleton() {
  return (
    <Layout showHeader={false} showFooter={false}>
      <AspectRatio ratio={16 / 9}>
        <Skeleton className="w-full h-full rounded-md" />
      </AspectRatio>

      <Skeleton className="h-8 w-3/4 mt-2" />

      <div className="flex justify-between mt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <Separator className="mb-2 mt-4" />

      <Skeleton className="h-6 w-24 mb-4" />

      <RatingItemSkeleton />
      <RatingItemSkeleton />
    </Layout>
  );
}
