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
  rpc: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
  invoke: vi.fn(),
  authCallback: undefined as AuthCallback | undefined,
  supabase: {
    rpc: vi.fn(),
    functions: { invoke: vi.fn() },
    auth: {
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
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

vi.mock("@/lib/notifications", () => ({
  cancelAllAccountNotifications: vi.fn().mockResolvedValue(undefined),
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
    localStorage.clear();
    mocks.supabase.rpc.mockReset().mockResolvedValue({
      data: {
        request_id: null,
        status: null,
        household_name: "Test household",
        is_owner: false,
        requires_successor: false,
        eligible_successors: [],
        deletes_household: false,
        is_subscription_payer: false,
        subscription_expires_at: null,
      },
      error: null,
    });
    mocks.supabase.auth.getSession.mockReset().mockResolvedValue({ data: { session: null } });
    mocks.supabase.auth.signOut.mockReset().mockResolvedValue({ error: null });
    mocks.supabase.functions.invoke.mockReset();
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

    await act(async () => {
      mocks.authCallback?.("SIGNED_IN", { user: userA });
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });
    expect(guards.get(userA.id)?.()).toBe(true);

    await act(async () => {
      mocks.authCallback?.("SIGNED_IN", { user: userB });
      vi.runOnlyPendingTimers();
      await Promise.resolve();
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

  it("gates the app in a resumable deletion state before loading a sanitized profile", async () => {
    mocks.supabase.rpc.mockResolvedValue({
      data: {
        request_id: "f0040000-0000-4000-8000-000000000050",
        status: "pending",
        retry_after_seconds: 60,
      },
      error: null,
    });
    mocks.fetchUserData.mockResolvedValue({ status: "signed_out" });
    const { result } = renderHook(() => useAuthBootstrap());

    await act(async () => {
      mocks.authCallback?.("INITIAL_SESSION", { user: userA });
      vi.runOnlyPendingTimers();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.state).toEqual({
      status: "deleting",
      requestId: "f0040000-0000-4000-8000-000000000050",
      retryAfterSeconds: 60,
      retrying: false,
    });
    expect(mocks.fetchUserData).toHaveBeenCalledWith(null, expect.any(Function));
    expect(JSON.parse(localStorage.getItem("plateful.accountDeletionRequest") ?? "null")).toEqual({
      userId: userA.id,
      requestId: "f0040000-0000-4000-8000-000000000050",
    });
  });

  it("discards an orphaned local receipt when the server has no deletion job", async () => {
    localStorage.setItem(
      "plateful.accountDeletionRequest",
      JSON.stringify({
        userId: userA.id,
        requestId: "f0040000-0000-4000-8000-000000000050",
      })
    );
    mocks.supabase.rpc.mockRejectedValueOnce(new Error("offline"));
    mocks.supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
    });
    mocks.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 404 } },
    });
    mocks.fetchUserData
      .mockResolvedValueOnce({ status: "signed_out" })
      .mockResolvedValueOnce({ status: "ready" });
    const { result } = renderHook(() => useAuthBootstrap());

    await act(async () => {
      mocks.authCallback?.("INITIAL_SESSION", { user: userA });
      vi.runOnlyPendingTimers();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.state.status).toBe("deleting");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(result.current.state).toEqual({ status: "ready" });
    expect(localStorage.getItem("plateful.accountDeletionRequest")).toBeNull();
    expect(mocks.fetchUserData).toHaveBeenLastCalledWith(userA, expect.any(Function));
  });
});
