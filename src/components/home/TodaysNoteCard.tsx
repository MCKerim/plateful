import { StickyNote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../ui/card";
import { PlannedNote } from "@/types/meal-planning.types";

type Props = {
  note: PlannedNote;
  /** Opens the note's text editor; the whole card is the tap. */
  onEdit: () => void;
};

/**
 * A note planned for today, under the meals: the day's word when there is
 * nothing to cook ("Eating out"). No "Cooked it": a note has no cooked state.
 */
export default function TodaysNoteCard({ note, onEdit }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <Card className="bg-transparent border-2">
      <button
        onClick={onEdit}
        className="flex w-full items-center gap-3 p-3 text-left"
        aria-label={t("mealPlannerItem.editNote")}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <StickyNote size={24} />
        </div>
        <h3 className="font-bold leading-tight text-md line-clamp-2 break-words">{note.text}</h3>
      </button>
    </Card>
  );
}
