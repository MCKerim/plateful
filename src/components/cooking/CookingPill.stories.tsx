import type { Meta, StoryObj } from "@storybook/react-vite";
import CookingPill from "./CookingPill";

const meta = {
  title: "Cooking/CookingPill",
  component: CookingPill,
  args: {
    name: "Miso soup with wakame",
    imageUrl: "/no-img.jpg",
    countdown: "4:32",
    onClick: () => {},
  },
} satisfies Meta<typeof CookingPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTimer: Story = {};

export const NoTimer: Story = { args: { countdown: null } };

export const NoCover: Story = {
  args: { imageUrl: null, name: "A very long recipe name that keeps going past the pill's width", countdown: null },
};
