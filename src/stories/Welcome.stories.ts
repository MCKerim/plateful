import Welcome from '@/page/onboarding/welcome/Welcome';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Onboarding/Welcome',
  component: Welcome,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Welcome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
