import type { Meta, StoryObj } from "@storybook/react-vite";
import PlannerEntryChooser from "./PlannerEntryChooser";

const meta = {
  title: "MealPlanner/PlannerEntryChooser",
  component: PlannerEntryChooser,
  args: {
    day: new Date(),
    open: true,
    onOpenChange: () => {},
    onRecipe: () => {},
    onNote: () => {},
  },
} satisfies Meta<typeof PlannerEntryChooser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
