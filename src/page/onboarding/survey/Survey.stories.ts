import type { Meta, StoryObj } from '@storybook/react-vite';
import Survey from './Survey';

const meta = {
  component: Survey,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Survey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
