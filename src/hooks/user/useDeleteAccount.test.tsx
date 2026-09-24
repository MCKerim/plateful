import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDeletionRequestError } from "@/lib/accountDeletion";
import { useDeleteAccount } from "./useDeleteAccount";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
  cancelAllAccountNotifications: vi.fn(),
  toastSuccess: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock("@/utils/supabase", () => ({
  useSupabase: () => ({
    supabase: {
      rpc: vi.fn(),
      functions: { invoke: mocks.invoke },
      auth: { getSession: mocks.getSession, signOut: mocks.signOut },
    },
  }),
}));
vi.mock("@/lib/notifications", () => ({
  cancelAllAccountNotifications: mocks.cancelAllAccountNotifications,
}));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: vi.fn() } }));
vi.mock("@/utils/reportError", () => ({ reportError: mocks.reportError }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function requestBody(call: number) {
  return mocks.invoke.mock.calls[call][1].body as {
    operation: string;
    request_id: string;
    successor_user_id: string | null;
  };
}

beforeEach(() => {
  localStorage.clear();
  mocks.invoke.mockReset();
  mocks.getSession
    .mockReset()
    .mockResolvedValue({ data: { session: { access_token: "test-token" } } });
  mocks.signOut.mockReset().mockResolvedValue({ error: null });
  mocks.cancelAllAccountNotifications.mockReset().mockResolvedValue(undefined);
  mocks.toastSuccess.mockReset();
  mocks.reportError.mockReset();
});

describe("useDeleteAccount", () => {
  it("signs out locally and confirms once the server has deleted the account", async () => {
    // The body describes the background erasure of PostHog and RevenueCat,
    // which this client never watches: a 2xx alone means the account is gone.
    mocks.invoke.mockResolvedValue({
      data: { request_id: "ignored", status: "processing", retry_after_seconds: 5 },
      error: null,
    });
    const { result } = renderHook(() => useDeleteAccount(false), { wrapper });

    await act(async () => {
      await result.current.deleteAccountMutation.mutateAsync({ successorUserId: "successor-1" });
    });

    expect(mocks.invoke).toHaveBeenCalledWith(
      "delete-account",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-token" },
        body: {
          operation: "request",
          request_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
          successor_user_id: "successor-1",
        },
      })
    );
    expect(mocks.cancelAllAccountNotifications).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.signOut.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.invoke.mock.invocationCallOrder[0]
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "settings.confirmations.deleteAccount.completed"
    );
    expect(localStorage.length).toBe(0);
  });

  it("keeps the session when the server refused and mints a new request id for the retry", async () => {
    mocks.invoke
      .mockResolvedValueOnce({ data: null, error: { context: { status: 409 } } })
      .mockResolvedValueOnce({ data: { request_id: "x", status: "completed" }, error: null });
    const { result } = renderHook(() => useDeleteAccount(false), { wrapper });

    let failure: unknown;
    await act(async () => {
      failure = await result.current.deleteAccountMutation
        .mutateAsync({ successorUserId: null })
        .catch((error: unknown) => error);
    });

    expect(failure).toBeInstanceOf(AccountDeletionRequestError);
    expect((failure as AccountDeletionRequestError).status).toBe(409);
    expect(mocks.cancelAllAccountNotifications).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.deleteAccountMutation.mutateAsync({ successorUserId: null });
    });

    expect(mocks.invoke).toHaveBeenCalledTimes(2);
    expect(requestBody(1).request_id).not.toBe(requestBody(0).request_id);
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });

  it("still counts a deletion as done when only the local clean-up fails", async () => {
    mocks.invoke.mockResolvedValue({ data: { request_id: "x", status: "completed" }, error: null });
    mocks.cancelAllAccountNotifications.mockRejectedValue(new Error("plugin missing"));
    mocks.signOut.mockResolvedValue({ error: new Error("storage locked") });
    const { result } = renderHook(() => useDeleteAccount(false), { wrapper });

    await act(async () => {
      await result.current.deleteAccountMutation.mutateAsync({ successorUserId: null });
    });

    expect(mocks.reportError).toHaveBeenCalledTimes(2);
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1);
  });
});
