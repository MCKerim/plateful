import type { Meta, StoryObj } from '@storybook/react-vite';
import MealPlanningValue from './MealPlanningValue';

const meta = {
  title: "Page/Onboarding/Value Screens/MealPlanningValue",
  component: MealPlanningValue,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MealPlanningValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
