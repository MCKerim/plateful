import type { Meta, StoryObj } from "@storybook/react-vite";
import SignUp from "./SignUp";

const meta = {
  title: "Page/Onboarding/SignUp",
  component: SignUp,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SignUp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
