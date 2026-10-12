import type { Meta, StoryObj } from "@storybook/react-vite";
import CookingInviteCard from "./CookingInviteCard";

const meta = {
  title: "Cooking/CookingInviteCard",
  component: CookingInviteCard,
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    name: "Chicken Katsu Curry",
    imageUrl: "/no-img.jpg",
    cookName: "Celine",
    onJoin: () => {},
    onOpen: () => {},
  },
} satisfies Meta<typeof CookingInviteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UnknownCook: Story = { args: { cookName: null, imageUrl: null } };
