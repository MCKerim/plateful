import type { Meta, StoryObj } from '@storybook/react-vite';
import ValueScreen from './ValueScreen';

const meta = {
  component: ValueScreen,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ValueScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
