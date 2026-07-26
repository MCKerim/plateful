import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthBootstrap } from "./useAuthBootstrap";

type AuthCallback = (
  event: string,
  session: { user: { id: string; email: string; created_at: string } } | null
) => void;

const mocks = vi.hoisted(() => ({
  fetchUserData: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
  closeBrowser: vi.fn(),
  authCallback: undefined as AuthCallback | undefined,
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
    },
  },
}));

vi.mock("@/utils/supabase", () => ({
  useSupabase: () => ({ supabase: mocks.supabase }),
}));

vi.mock("./useUserData", () => ({
  useUserData: () => ({ fetchUserData: mocks.fetchUserData }),
}));

vi.mock("@/utils/nativeBrowser", () => ({
  closeBrowser: mocks.closeBrowser,
}));

const userA = {
  id: "user-a",
  email: "a@example.com",
  created_at: "2026-07-26T12:00:00Z",
};

const userB = {
  id: "user-b",
  email: "b@example.com",
  created_at: "2026-07-26T12:00:00Z",
};

describe("useAuthBootstrap", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.fetchUserData.mockReset();
    mocks.unsubscribe.mockReset();
    mocks.closeBrowser.mockReset().mockResolvedValue(undefined);
    mocks.authCallback = undefined;
    mocks.supabase.auth.onAuthStateChange
      .mockReset()
      .mockImplementation((callback: AuthCallback) => {
        mocks.authCallback = callback;
        return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
      });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ignores completion from an older auth generation", async () => {
    const resolvers = new Map<string, (result: { status: "ready" }) => void>();
    const guards = new Map<string, () => boolean>();
    mocks.fetchUserData.mockImplementation(
      (authUser: typeof userA, isCurrent: () => boolean) =>
        new Promise<{ status: "ready" }>((resolve) => {
          resolvers.set(authUser.id, resolve);
          guards.set(authUser.id, isCurrent);
        })
    );
    const { result } = renderHook(() => useAuthBootstrap());

    act(() => {
      mocks.authCallback?.("SIGNED_IN", { user: userA });
      vi.runOnlyPendingTimers();
      mocks.authCallback?.("SIGNED_IN", { user: userB });
      vi.runOnlyPendingTimers();
    });

    expect(guards.get(userA.id)?.()).toBe(false);
    expect(guards.get(userB.id)?.()).toBe(true);

    await act(async () => {
      resolvers.get(userB.id)?.({ status: "ready" });
      await Promise.resolve();
    });
    expect(result.current.state).toEqual({ status: "ready" });

    await act(async () => {
      resolvers.get(userA.id)?.({ status: "ready" });
      await Promise.resolve();
    });
    expect(result.current.state).toEqual({ status: "ready" });
  });

  it("shows a retry state while preserving the authenticated session", async () => {
    mocks.fetchUserData
      .mockResolvedValueOnce({ status: "failed", stage: "profile" })
      .mockResolvedValueOnce({ status: "ready" });
    const { result } = renderHook(() => useAuthBootstrap());

    await act(async () => {
      mocks.authCallback?.("INITIAL_SESSION", { user: userA });
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });
    expect(result.current.state).toEqual({ status: "error", stage: "profile" });

    await act(async () => {
      result.current.retry();
      await Promise.resolve();
    });
    expect(result.current.state).toEqual({ status: "ready" });
    expect(mocks.fetchUserData).toHaveBeenLastCalledWith(userA, expect.any(Function));
  });

  it("keeps routine refresh failures nonblocking but blocks a household transition", async () => {
    mocks.fetchUserData
      .mockResolvedValueOnce({ status: "ready" })
      .mockResolvedValueOnce({ status: "failed", stage: "profile" })
      .mockResolvedValueOnce({ status: "failed", stage: "household" });
    const { result } = renderHook(() => useAuthBootstrap());

    await act(async () => {
      mocks.authCallback?.("INITIAL_SESSION", { user: userA });
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });
    expect(result.current.state).toEqual({ status: "ready" });

    await act(async () => {
      await result.current.refreshUser(userA);
    });
    expect(result.current.state).toEqual({ status: "ready" });

    await act(async () => {
      await result.current.refreshUser(userA, true);
    });
    expect(result.current.state).toEqual({ status: "error", stage: "household" });
  });
});
