import type { Meta, StoryObj } from "@storybook/react-vite";
import ChatbotValue from "./ChatbotValue";

const meta = {
  title: "Page/Onboarding/Value Screens/ChatbotValue",
  component: ChatbotValue,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ChatbotValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
