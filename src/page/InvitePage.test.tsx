import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvitePage from "./InvitePage";

const mocks = vi.hoisted(() => ({ preview: vi.fn(), toastError: vi.fn() }));

vi.mock("@/api/invite.api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/invite.api")>()),
  inviteApi: { preview: mocks.preview, accept: vi.fn() },
}));
vi.mock("@/utils/supabase", () => ({ useSupabase: () => supabaseValue }));
vi.mock("@/redux/hooks", () => ({ useAppSelector: () => null }));
vi.mock("posthog-js/react", () => ({ usePostHog: () => null }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError, success: vi.fn() } }));
// Module-level constants: a fresh identity per render would re-run the load effect.
const supabaseValue = { supabase: {} };
const translation = {
  t: (key: string, options?: { count?: number }) =>
    options?.count === undefined ? key : `${key}:${options.count}`,
};
vi.mock("react-i18next", () => ({ useTranslation: () => translation }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/invite/abc123"]}>
      <Routes>
        <Route path="/invite/:token" element={<InvitePage refreshUser={async () => true} />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("InvitePage", () => {
  it("names the household and offers to join, like the iOS invite screen", async () => {
    mocks.preview.mockResolvedValue({
      status: "ready",
      householdId: "h1",
      householdName: "Smith Family",
    });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Smith Family" })).toBeInTheDocument();
    expect(screen.getByText("invitePage.invitedTo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "invitePage.joinButton" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "invitePage.declineButton" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "common.close" })).toHaveAttribute("href", "/");
  });

  it("explains an invalid or expired link on the page instead of a toast", async () => {
    mocks.preview.mockResolvedValue({ status: "unavailable" });
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "invitePage.unavailableTitle" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "invitePage.joinButton" })).toBeNull();
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("says when to try again after too many invite links", async () => {
    mocks.preview.mockResolvedValue({ status: "rate_limited", retryAfterSeconds: 421 });
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "invitePage.rateLimitedTitle" })
    ).toBeInTheDocument();
    expect(screen.getByText("invitePage.rateLimited:8")).toBeInTheDocument();
  });
});
