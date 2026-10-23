import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** The round check in front of a checklist line and on a Plan sheet section: filled accent once on. */
export default function CheckMark({ isSelected }: Readonly<{ isSelected: boolean }>) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
        isSelected ? "border-accent bg-accent text-accent-foreground" : "border-muted-foreground/50"
      )}
      aria-hidden
    >
      {isSelected && <Check className="size-4" strokeWidth={3} />}
    </span>
  );
}
