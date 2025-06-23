import type { Preview } from "@storybook/react-vite";
import { withRouter } from "storybook-addon-remix-react-router";
import "../src/index.css";
import { Provider } from "react-redux"
import { store } from "../src/redux/store.ts";

const preview: Preview = {
  decorators: [withRouter,
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ["Page", ["Onboarding", ["Welcome", "SignUp", "ValueScreen",  "Survey", "CreateHousehold", "InviteMembers", "JoinHousehold"]]],
      }
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
