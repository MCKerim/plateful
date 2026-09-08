import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { useCreateNote } from "@/hooks/meal-planning/useCreateNote";
import { useUpdateNoteText } from "@/hooks/meal-planning/useUpdateNoteText";
import { useNoteSuggestions } from "@/hooks/meal-planning/useNoteSuggestions";
import { mergeNoteSuggestions } from "@/lib/mealPlanHelper/mealPlanHelper";
import { reportError } from "@/utils/reportError";
import { PlannedNote } from "@/types/meal-planning.types";

/** A new note for a day (or the pool), or an existing note's text. */
export type NoteDialogState =
  | { mode: "create"; day: Date | null }
  | { mode: "edit"; note: PlannedNote };

type Props = {
  state: NoteDialogState | null;
  onClose: () => void;
};

const SUGGESTIONS = ["eatingOut", "birthday", "leftovers", "atFamilys"] as const;

function mintDraftIds() {
  return { noteId: crypto.randomUUID(), entryId: crypto.randomUUID() };
}

/**
 * One text field and a few suggestions. Adding creates the note with its
 * first placement; saving changes the text on every copy. The draft stays in
 * the dialog until the server confirmed, so a failed save loses nothing.
 */
export default function NoteDialog({ state, onClose }: Readonly<Props>) {
  const { t, i18n } = useTranslation();
  const householdId = useAppSelector(selectHouseholdId);
  const createNote = useCreateNote();
  const updateNoteText = useUpdateNoteText();
  // What this household plans leads the chips; the built-ins fill up.
  const { data: ownSuggestions = [] } = useNoteSuggestions(householdId, state !== null);
  const chips = mergeNoteSuggestions(
    ownSuggestions,
    SUGGESTIONS.map((key) => t(`mealPlanner.note.suggestion.${key}`))
  );

  const [text, setText] = useState("");
  // Minted per draft and kept until it saved (see `useCreateNote`).
  const [draftIds, setDraftIds] = useState(mintDraftIds);

  // Each opening starts a fresh draft: the field from the note being edited
  // or empty, new ids. State adjusted during render (React's pattern for a
  // changed prop), no effect. The last opening is also what the closing
  // dialog keeps showing through its exit animation, since `state` is
  // cleared on close.
  const [openedFor, setOpenedFor] = useState<NoteDialogState | null>(null);
  if (state && state !== openedFor) {
    setOpenedFor(state);
    setText(state.mode === "edit" ? state.note.text : "");
    setDraftIds(mintDraftIds());
  }
  const shown = state ?? openedFor;

  const isSaving = createNote.isPending || updateNoteText.isPending;
  const trimmed = text.trim();

  const placementDay =
    shown?.mode === "create" ? shown.day : shown?.mode === "edit" ? shown.note.planned_date : null;
  const placementLabel = placementDay
    ? format(placementDay, "EEEE, dd.MM", { locale: i18n.language === "de" ? de : enUS })
    : t("mealPlanner.noDate");

  async function save() {
    if (!state || !trimmed || isSaving) return;
    try {
      if (state.mode === "edit") {
        await updateNoteText.mutateAsync({ noteId: state.note.noteId, text: trimmed });
      } else {
        if (!householdId) throw new Error("No household to plan for");
        await createNote.mutateAsync({
          householdId,
          noteId: draftIds.noteId,
          entryId: draftIds.entryId,
          text: trimmed,
          plannedDate: state.day,
        });
      }
      onClose();
    } catch (error) {
      reportError("planner note save failed", error, { mode: state.mode });
      toast.error(t("mealPlanner.note.saveError"));
    }
  }

  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {shown?.mode === "edit" ? t("mealPlanner.note.editTitle") : t("mealPlanner.note.title")}
          </DialogTitle>
          <DialogDescription>{placementLabel}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("mealPlanner.note.placeholder")}
            rows={2}
            maxHeight={140}
            enterKeyHint="done"
            disabled={isSaving}
            aria-label={t("mealPlanner.note.title")}
          />

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{t("mealPlanner.note.suggestions")}</p>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Button
                  key={chip}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={isSaving}
                  onClick={() => setText(chip)}
                >
                  {chip}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={save} disabled={!trimmed || isSaving}>
            {isSaving
              ? t("common.saving")
              : shown?.mode === "edit"
                ? t("common.save")
                : t("mealPlanner.note.add")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
