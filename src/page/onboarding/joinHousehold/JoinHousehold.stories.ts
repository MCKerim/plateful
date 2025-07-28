import type { Meta, StoryObj } from '@storybook/react-vite';
import JoinHousehold from './JoinHousehold';

const meta = {
  title: "Page/Onboarding/JoinHousehold",
  component: JoinHousehold,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof JoinHousehold>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
