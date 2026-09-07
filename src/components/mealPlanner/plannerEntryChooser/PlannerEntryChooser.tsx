import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { BookOpen, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type Props = {
  /** The day the entry is for; `null` while the drawer is closed. */
  day: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recipe chosen: the cookbook, where a recipe is planned from. */
  onRecipe: (day: Date) => void;
  /** Note chosen: the note dialog for this day. */
  onNote: (day: Date) => void;
};

/**
 * What a day's "+" offers: a recipe (today's path through the cookbook) or a
 * note ("Eating out", "Leftovers"). A bottom drawer like the row menus.
 */
export default function PlannerEntryChooser({
  day,
  open,
  onOpenChange,
  onRecipe,
  onNote,
}: Readonly<Props>) {
  const { t, i18n } = useTranslation();
  // The day is cleared on close; keep the last one so the closing drawer
  // doesn't lose its subtitle mid-animation (state adjusted during render,
  // React's pattern for remembering a previous prop).
  const [lastDay, setLastDay] = useState<Date | null>(day);
  if (day && day !== lastDay) setLastDay(day);
  const shownDay = day ?? lastDay;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("mealPlanner.addToPlan")}</DrawerTitle>
          {shownDay && (
            <DrawerDescription>
              {format(shownDay, "EEEE, dd.MM", { locale: i18n.language === "de" ? de : enUS })}
            </DrawerDescription>
          )}
        </DrawerHeader>

        <DrawerFooter className="gap-2 mb-8">
          <DrawerClose asChild>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => shownDay && onRecipe(shownDay)}
            >
              <BookOpen size={20} />
              {t("mealPlanner.addRecipe")}
            </Button>
          </DrawerClose>

          <DrawerClose asChild>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => shownDay && onNote(shownDay)}
            >
              <StickyNote size={20} />
              {t("mealPlanner.addNote")}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
