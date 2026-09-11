import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setUser, setUserWeekStart } from "@/redux/slices/userSlice";
import { setHousehold, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { useUserData } from "./useUserData";
import { markPendingSignIn, spendPendingSignIn } from "@/lib/pendingSignIn";

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  queryClientClear: vi.fn(),
  getCurrent: vi.fn(),
  getHousehold: vi.fn(),
  getHouseholdMembers: vi.fn(),
  updateLanguage: vi.fn(),
  seedWeekStart: vi.fn(),
  posthogIdentify: vi.fn(),
  posthogReset: vi.fn(),
  posthogCaptureException: vi.fn(),
  posthogCapture: vi.fn(),
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
    seedWeekStart: mocks.seedWeekStart,
  },
}));

vi.mock("posthog-js", () => ({
  default: {
    identify: mocks.posthogIdentify,
    reset: mocks.posthogReset,
    // `reportError` reports through the same singleton, so every error
    // path exercised here calls this too.
    captureException: mocks.posthogCaptureException,
    capture: mocks.posthogCapture,
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
  deletion_requested_at: null,
  has_completed_survey: true,
  notification_preferences: null,
  week_start: 1,
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
    mocks.seedWeekStart.mockReset().mockResolvedValue(1);
    mocks.updateLanguage.mockReset().mockResolvedValue(undefined);
    mocks.posthogIdentify.mockReset();
    mocks.posthogReset.mockReset();
    mocks.posthogCaptureException.mockReset();
    mocks.posthogCapture.mockReset();
    // Drain whatever a previous test left owed.
    spendPendingSignIn();
    mocks.changeLanguage.mockReset().mockResolvedValue(undefined);
    mocks.identifyUser.mockReset().mockResolvedValue(null);
    mocks.logoutUser.mockReset().mockResolvedValue(null);
    mocks.socialLogout.mockReset().mockResolvedValue(undefined);
  });

  it("seeds a profile without a week start from the device and adopts the answer", async () => {
    mocks.getCurrent.mockResolvedValue({ ...user, week_start: null });
    // Another device won the race: the account holds Sunday, so this one adopts it.
    mocks.seedWeekStart.mockResolvedValue(0);
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(authUser));

    await vi.waitFor(() => {
      expect(mocks.dispatch).toHaveBeenCalledWith(setUserWeekStart(0));
    });
    expect(mocks.seedWeekStart).toHaveBeenCalledWith(mocks.supabase, expect.any(Number));
  });

  it("leaves a seeded profile's week start alone", async () => {
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(authUser));

    expect(mocks.seedWeekStart).not.toHaveBeenCalled();
  });

  it("captures the owed signed_in only after the person is identified", async () => {
    markPendingSignIn("magic_link");
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(authUser));

    expect(mocks.posthogCapture).toHaveBeenCalledWith("signed_in", { method: "magic_link" });
    // Person properties are stamped at ingestion: an event captured before
    // identify keeps `email = null` for good.
    expect(mocks.posthogIdentify.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.posthogCapture.mock.invocationCallOrder[0]
    );
    // Spent once: a later refresh of the same session is not another sign-in.
    await act(() => result.current.fetchUserData(authUser));
    expect(mocks.posthogCapture).toHaveBeenCalledTimes(1);
  });

  it("reports no sign-in on an ordinary reload", async () => {
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(authUser));

    expect(mocks.posthogIdentify).toHaveBeenCalled();
    expect(mocks.posthogCapture).not.toHaveBeenCalled();
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

  it("reports the device language upward without letting the stored one change the interface", async () => {
    mocks.getCurrent.mockResolvedValue({ ...user, language: "de" });
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(authUser));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The device owns the interface language. Pulling "de" down from the
    // server is what used to undo a language change made on another client.
    expect(mocks.changeLanguage).not.toHaveBeenCalled();
    expect(mocks.updateLanguage).toHaveBeenCalledWith(mocks.supabase, {
      userId: user.id,
      language: "en",
    });
  });

  it("leaves the stored language alone when it already matches the device", async () => {
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(authUser));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mocks.updateLanguage).not.toHaveBeenCalled();
  });

  it("returns a retryable failure without publishing partial household state", async () => {
    mocks.getHousehold.mockRejectedValue(new Error("Temporary household failure"));
    const { result } = renderHook(() => useUserData());

    let loadResult;
    await act(async () => {
      loadResult = await result.current.fetchUserData(authUser);
    });

    expect(loadResult).toEqual({ status: "failed", stage: "household" });
    expect(mocks.dispatch).not.toHaveBeenCalledWith(setUser(user));
    expect(mocks.dispatch).not.toHaveBeenCalledWith(setHousehold(null));
    expect(mocks.dispatch).not.toHaveBeenCalledWith(setHouseholdMembers(null));
    expect(mocks.dispatch).not.toHaveBeenCalledWith(setUser(null));
  });

  it("does not turn a profile request failure into a client-side logout", async () => {
    mocks.getCurrent.mockRejectedValue(new Error("Temporary profile failure"));
    const { result } = renderHook(() => useUserData());

    let loadResult;
    await act(async () => {
      loadResult = await result.current.fetchUserData(authUser);
    });

    expect(loadResult).toEqual({ status: "failed", stage: "profile" });
    expect(mocks.dispatch).not.toHaveBeenCalledWith(setUser(null));
  });

  it("does not publish a profile after its auth generation is superseded", async () => {
    let resolveProfile: ((value: typeof user) => void) | undefined;
    mocks.getCurrent.mockImplementation(
      () =>
        new Promise<typeof user>((resolve) => {
          resolveProfile = resolve;
        })
    );
    let isCurrent = true;
    const { result } = renderHook(() => useUserData());

    let loadPromise!: Promise<unknown>;
    act(() => {
      loadPromise = result.current.fetchUserData(authUser, () => isCurrent);
    });
    isCurrent = false;
    resolveProfile?.(user);

    let loadResult;
    await act(async () => {
      loadResult = await loadPromise;
    });

    expect(loadResult).toEqual({ status: "superseded" });
    expect(mocks.dispatch).not.toHaveBeenCalledWith(setUser(user));
  });

  it("clears local user data when Supabase reports no authenticated user", async () => {
    const { result } = renderHook(() => useUserData());

    await act(() => result.current.fetchUserData(null));

    expect(mocks.dispatch).toHaveBeenCalledWith(setUser(null));
    expect(mocks.queryClientClear).toHaveBeenCalledOnce();
  });

  it("keeps the analytics identity for a visitor who was never signed in", async () => {
    const { result } = renderHook(() => useUserData());

    // Supabase hands every new `onAuthStateChange` subscriber a null session, so
    // this branch runs constantly for anonymous visitors. `posthog.reset()`
    // mints a fresh distinct_id and session id each time, which turned single
    // visitors into hundreds of "persons".
    await act(() => result.current.fetchUserData(null));
    await act(() => result.current.fetchUserData(null));

    expect(mocks.posthogReset).not.toHaveBeenCalled();
  });

  it("resets the analytics identity on a real sign-out", async () => {
    const { result } = renderHook(() => useUserData());

    await act(() =>
      result.current.fetchUserData(null, () => true, { resetAnalyticsIdentity: true })
    );

    expect(mocks.posthogReset).toHaveBeenCalledOnce();
  });
});
