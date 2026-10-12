import type { Meta, StoryObj } from "@storybook/react-vite";
import CookingStep from "./CookingStep";
import { prepareStep } from "@/lib/cooking/stepTokens";
import type { ScaledIngredient } from "@/types/ingredient.types";

const flour: ScaledIngredient = {
  id: "i1",
  recipeId: "r1",
  rawText: "250 g flour",
  quantity: { value: 250, display: "250" },
  unit: "g",
  unitNormalized: "g",
  name: "flour",
  nameNormalized: "flour",
  preparationNote: "sifted",
  isOptional: false,
  groupName: null,
  sortOrder: 0,
  isScalable: true,
  ingredientSlug: "flour",
  scaledQuantity: { value: 375, display: "375 g flour" },
};

const STEP = "Beat in the eggs one at a time, then fold in the 250 g flour and rest for 10 minutes.";
const annotated = prepareStep(
  STEP,
  {
    v: 1,
    template: "Beat in the {0} one at a time, then fold in the {1} and rest for {2}.",
    entities: [
      { t: "ing", ingredient_id: "i2", text: "eggs", emoji: "🥚", amount: false },
      { t: "ing", ingredient_id: "i1", text: "250 g flour", emoji: "🌾", amount: true },
      { t: "timer", seconds: 600, text: "10 minutes", label: "Rest the batter" },
    ],
  },
  new Set(["i1"])
);

const meta = {
  title: "Cooking/CookingStep",
  component: CookingStep,
  decorators: [
    (Story) => (
      <div className="max-w-md p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    stepText: "Season the steak well and sear it hard on both sides.",
    sectionName: null,
    tokens: [],
    isCurrent: true,
    ingredientsById: new Map([["i1", flour]]),
    onSelect: () => {},
  },
} satisfies Meta<typeof CookingStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const Dimmed: Story = { args: { isCurrent: false, sectionName: "For the sauce" } };

export const WithChips: Story = {
  args: { stepText: STEP, tokens: annotated.tokens, sectionName: "For the cake" },
};

export const RunningTimer: Story = {
  args: {
    stepText: STEP,
    tokens: annotated.tokens,
    chipState: () => "running",
    chipCountdown: () => "9:41",
  },
};

export const RegexTimers: Story = {
  args: {
    stepText: "Sauté 3 minutes, then simmer 20 minutes.",
    tokens: prepareStep("Sauté 3 minutes, then simmer 20 minutes.", null, new Set()).tokens,
  },
};
