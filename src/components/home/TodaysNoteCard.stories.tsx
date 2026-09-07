import type { Meta, StoryObj } from "@storybook/react-vite";
import TodaysNoteCard from "./TodaysNoteCard";

const meta = {
  title: "Home/TodaysNoteCard",
  component: TodaysNoteCard,
  args: {
    note: {
      kind: "note",
      id: "placement-1",
      noteId: "note-1",
      text: "Eating out",
      planned_date: new Date(),
    },
    onEdit: () => {},
  },
} satisfies Meta<typeof TodaysNoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongText: Story = {
  args: {
    note: {
      kind: "note",
      id: "placement-2",
      noteId: "note-2",
      text: "Leftovers from the birthday, then a long walk along the river before it gets dark",
      planned_date: new Date(),
    },
  },
};
