import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setUser } from "@/redux/slices/userSlice";
import { useUserData } from "./useUserData";

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  queryClientClear: vi.fn(),
  getCurrent: vi.fn(),
  getHousehold: vi.fn(),
  getHouseholdMembers: vi.fn(),
  updateLanguage: vi.fn(),
  posthogIdentify: vi.fn(),
  posthogReset: vi.fn(),
  changeLanguage: vi.fn(),
  identifyUser: vi.fn(),
  logoutUser: vi.fn(),
  socialLogout: vi.fn(),
  supabase: {},
}));

vi.mock("@/redux/hooks", () => ({
  useAppDispatch: () => mocks.dispatch,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: mocks.queryClientClear }),
}));

vi.mock("@/utils/supabase", () => ({
  useSupabase: () => ({ supabase: mocks.supabase }),
}));

vi.mock("@/api/user.api", () => ({
  userApi: {
    getCurrent: mocks.getCurrent,
    getHousehold: mocks.getHousehold,
    getHouseholdMembers: mocks.getHouseholdMembers,
    updateLanguage: mocks.updateLanguage,
  },
}));

vi.mock("posthog-js", () => ({
  default: {
    identify: mocks.posthogIdentify,
    reset: mocks.posthogReset,
  },
}));

vi.mock("@/i18n", () => ({
  default: {
    language: "en",
    changeLanguage: mocks.changeLanguage,
  },
}));

vi.mock("@/lib/revenuecat", () => ({
  identifyUser: mocks.identifyUser,
  logoutUser: mocks.logoutUser,
}));

vi.mock("@capgo/capacitor-social-login", () => ({
  SocialLogin: {
    logout: mocks.socialLogout,
  },
}));

const authUser = {
  id: "auth-user-id",
  email: "user@example.com",
  created_at: "2026-07-26T12:00:00Z",
};

const user = {
  ...authUser,
  username: "plateful-user",
  household_id: "household-id",
  language: "en",
  has_completed_survey: true,
  notification_preferences: null,
};

describe("useUserData", () => {
  beforeEach(() => {
    mocks.dispatch.mockReset();
    mocks.queryClientClear.mockReset();
    mocks.getCurrent.mockReset().mockResolvedValue(user);
    mocks.getHousehold.mockReset().mockResolvedValue({
      id: "household-id",
      name: "Test household",
      owner_id: user.id,
      created_at: "2026-07-26T12:00:00Z",
    });
    mocks.getHouseholdMembers.mockReset().mockResolvedValue([]);
    mocks.updateLanguage.mockReset().mockResolvedValue(undefined);
    mocks.posthogIdentify.mockReset();
    mocks.posthogReset.mockReset();
    mocks.changeLanguage.mockReset().mockResolvedValue(undefined);
    mocks.identifyUser.mockReset().mockResolvedValue(null);
    mocks.logoutUser.mockReset().mockResolvedValue(null);
    mocks.socialLogout.mockReset().mockResolvedValue(undefined);
  });

  it("keeps the authenticated user when PostHog identification fails", async () => {
    mocks.posthogIdentify.mockImplementation(() => {
      throw new Error("PostHog is blocked");
    });
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(authUser));

    expect(mocks.dispatch).toHaveBeenCalledWith(setUser(user));
    expect(mocks.dispatch).not.toHaveBeenCalledWith(setUser(null));
  });

  it("keeps the authenticated user when household loading fails", async () => {
    mocks.getHousehold.mockRejectedValue(new Error("Temporary household failure"));
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(authUser));

    expect(mocks.dispatch).toHaveBeenCalledWith(setUser(user));
    expect(mocks.dispatch).not.toHaveBeenCalledWith(setUser(null));
  });

  it("does not turn a profile request failure into a client-side logout", async () => {
    mocks.getCurrent.mockRejectedValue(new Error("Temporary profile failure"));
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(authUser));

    expect(mocks.dispatch).not.toHaveBeenCalledWith(setUser(null));
  });

  it("clears local user data when Supabase reports no authenticated user", async () => {
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(null));

    expect(mocks.dispatch).toHaveBeenCalledWith(setUser(null));
    expect(mocks.queryClientClear).toHaveBeenCalledOnce();
    expect(mocks.posthogReset).toHaveBeenCalledOnce();
  });
});
