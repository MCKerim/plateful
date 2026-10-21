import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppUrlListener from "./AppUrlListener";

const navigate = vi.fn();
let onUrlOpen: (event: { url: string }) => void = () => {};

vi.mock("react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/utils/supabase", () => ({ useSupabase: () => ({ supabase: {} }) }));
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (_: string, cb: typeof onUrlOpen) => {
      onUrlOpen = cb;
    },
  },
}));

describe("AppUrlListener", () => {
  beforeEach(() => navigate.mockClear());

  it("keeps the query of an App Link, so OAuth consent gets its authorization_id", () => {
    render(<AppUrlListener />);
    onUrlOpen({ url: "https://app.plateful.cloud/oauth/consent?authorization_id=abc123" });
    expect(navigate).toHaveBeenCalledWith("/oauth/consent?authorization_id=abc123");
  });
});
