import type { Meta, StoryObj } from '@storybook/react-vite';
import BetaScreen from './BetaScreen';

const meta = {
  title: "Page/Onboarding/BetaScreen",
  component: BetaScreen,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BetaScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
