import type { Meta, StoryObj } from '@storybook/react-vite';
import CreateHousehold from './CreateHousehold';

const meta = {
  component: CreateHousehold,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof CreateHousehold>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
