import type { Meta, StoryObj } from '@storybook/react-vite';
import ImportRecipes from './ImportRecipes';

const meta = {
  title: "Page/Onboarding/Value Screens/ImportRecipes",
  component: ImportRecipes,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ImportRecipes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
