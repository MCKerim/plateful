import type { Meta, StoryObj } from "@storybook/react-vite";
import InviteMembers from "./InviteMembers";

const meta = {
  title: "Page/Onboarding/InviteMembers",
  component: InviteMembers,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof InviteMembers>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
