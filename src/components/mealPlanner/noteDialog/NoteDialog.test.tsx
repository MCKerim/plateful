import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NoteDialog, { NoteDialogState } from "./NoteDialog";

const mocks = vi.hoisted(() => ({
  createNote: vi.fn(),
  updateNoteText: vi.fn(),
  toastError: vi.fn(),
  captureException: vi.fn(),
  onClose: vi.fn(),
}));

vi.mock("@/utils/supabase", () => ({ useSupabase: () => ({ supabase: {} }) }));
vi.mock("@/api/meal-planning.api", () => ({
  mealPlanningApi: { createNote: mocks.createNote, updateNoteText: mocks.updateNoteText },
}));
vi.mock("@/redux/hooks", () => ({ useAppSelector: () => "household-1" }));
vi.mock("@/redux/slices/householdSlice", () => ({ selectHouseholdId: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));
vi.mock("posthog-js", () => ({ default: { captureException: mocks.captureException } }));
// The date helper pulls the i18n singleton in for its own formatter.
vi.mock("@/i18n", () => ({ default: { language: "en" } }));

// i18n isn't initialised in tests: render the keys, which is enough to tell
// which string was chosen and what a suggestion chip put into the field.
const translation = { t: (key: string) => key, i18n: { language: "en" } };
vi.mock("react-i18next", () => ({ useTranslation: () => translation }));

function renderDialog(state: NoteDialogState) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NoteDialog state={state} onClose={mocks.onClose} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mocks.createNote.mockReset();
  mocks.updateNoteText.mockReset();
  mocks.toastError.mockReset();
  mocks.captureException.mockReset();
  mocks.onClose.mockReset();
  // The auto-growing textarea restores the scroll position; jsdom has none.
  window.scrollTo = vi.fn();
});

describe("NoteDialog", () => {
  it("creates the note for its day from a suggestion, keeping the draft's ids across a retry", async () => {
    mocks.createNote.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    renderDialog({ mode: "create", day: new Date(2026, 8, 13) });
    const user = userEvent.setup();

    const add = screen.getByRole("button", { name: "mealPlanner.note.add" });
    expect(add).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "mealPlanner.note.suggestion.leftovers" }));
    expect(screen.getByRole("textbox")).toHaveValue("mealPlanner.note.suggestion.leftovers");

    // A failed save keeps the draft in the dialog and says so.
    await user.click(add);
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("mealPlanner.note.saveError")
    );
    expect(mocks.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("mealPlanner.note.suggestion.leftovers");

    // The retry lands on the same note: same ids, so the server can't make two.
    await user.click(screen.getByRole("button", { name: "mealPlanner.note.add" }));
    await waitFor(() => expect(mocks.onClose).toHaveBeenCalled());

    expect(mocks.createNote).toHaveBeenCalledTimes(2);
    const [first, second] = mocks.createNote.mock.calls.map((call) => call[1]);
    expect(first).toMatchObject({
      householdId: "household-1",
      text: "mealPlanner.note.suggestion.leftovers",
      plannedDate: "2026-09-13",
    });
    expect(second.noteId).toBe(first.noteId);
    expect(second.entryId).toBe(first.entryId);
  });

  it("never saves blank text", async () => {
    renderDialog({ mode: "create", day: null });
    const user = userEvent.setup();

    await user.type(screen.getByRole("textbox"), "   ");
    expect(screen.getByRole("button", { name: "mealPlanner.note.add" })).toBeDisabled();
    expect(screen.getByText("mealPlanner.noDate")).toBeInTheDocument();
  });

  it("edits the text every copy of an existing note shares, trimmed", async () => {
    mocks.updateNoteText.mockResolvedValue(undefined);
    renderDialog({
      mode: "edit",
      note: {
        kind: "note",
        id: "placement-1",
        noteId: "note-1",
        text: "Birthday",
        planned_date: null,
      },
    });
    const user = userEvent.setup();

    const field = screen.getByRole("textbox");
    expect(field).toHaveValue("Birthday");
    await user.clear(field);
    await user.type(field, "  Birthday at Lisa's  ");
    await user.click(screen.getByRole("button", { name: "common.save" }));

    await waitFor(() => expect(mocks.onClose).toHaveBeenCalled());
    expect(mocks.updateNoteText).toHaveBeenCalledWith({}, "note-1", "Birthday at Lisa's");
    expect(mocks.createNote).not.toHaveBeenCalled();
  });
});
