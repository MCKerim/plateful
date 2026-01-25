import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MealPlannerItemSkeleton() {
  return (
    <Card className="h-[72px] flex items-center">
      <Skeleton className="h-full w-[74px] rounded-l-lg rounded-r-none" />

      <div className="flex-1 px-2.5 space-y-2">
        <Skeleton className="h-4 w-3/4" />

        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  );
}
