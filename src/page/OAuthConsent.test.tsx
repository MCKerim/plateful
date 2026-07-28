import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OAuthConsent from "./OAuthConsent";

const mocks = vi.hoisted(() => ({
  getAuthorizationDetails: vi.fn(),
  approveAuthorization: vi.fn(),
  denyAuthorization: vi.fn(),
  household: { name: "Team Kitchen" } as { name: string } | null,
  toastError: vi.fn(),
  redirectTo: vi.fn(),
  signOut: vi.fn(),
}));

// Redefining `window.location` to observe navigation crashes the jsdom worker,
// so the page routes its external redirect through this module instead — the
// same one every other `location.href` assignment in the app already lives in.
vi.mock("@/utils/nativeBrowser", () => ({ redirectTo: mocks.redirectTo }));

// Hoisted to a single constant, not rebuilt per call: `SupabaseProvider` memoizes
// this value, and the consent effect lists `supabase` in its dependencies. A mock
// that returns a fresh object each render re-fires the effect forever and hangs
// the worker. Same reason `useTranslation` below is a constant.
const supabaseValue = {
  supabase: {
    auth: {
      oauth: {
        getAuthorizationDetails: mocks.getAuthorizationDetails,
        approveAuthorization: mocks.approveAuthorization,
        denyAuthorization: mocks.denyAuthorization,
      },
      signOut: mocks.signOut,
    },
  },
};
vi.mock("@/utils/supabase", () => ({ useSupabase: () => supabaseValue }));

vi.mock("@/redux/hooks", () => ({ useAppSelector: () => mocks.household }));
vi.mock("@/redux/slices/householdSlice", () => ({ selectHousehold: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

// The real Layout drags in the header/bottom-nav shell (redux + router state);
// this page's behaviour is entirely inside it.
vi.mock("@/components/layout/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// i18n isn't initialised in tests, so render the key plus its interpolations —
// enough to assert *which* string was chosen without asserting on wording.
// `t` and the returned object are module-level constants: real react-i18next
// keeps them stable, and a fresh identity per render would re-fire any effect
// that depends on them.
const translate = (key: string, values?: Record<string, string>) =>
  values ? `${key}:${Object.values(values).join(",")}` : key;
const translation = { t: translate };
vi.mock("react-i18next", () => ({ useTranslation: () => translation }));

beforeEach(() => {
  mocks.redirectTo.mockClear();
  mocks.signOut.mockClear();
  mocks.household = { name: "Team Kitchen" };
});

function renderPage(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/oauth/consent${search}`]}>
      <OAuthConsent />
    </MemoryRouter>,
  );
}

const details = {
  authorization_id: "auth-123",
  redirect_uri: "https://claude.ai/api/mcp/auth_callback",
  client: { id: "c1", name: "Claude", uri: "https://claude.ai", logo_uri: "" },
  user: { id: "u1", email: "cook@example.com" },
  scope: "openid email",
};

describe("OAuthConsent", () => {
  it("names the app and spells out every permission before consenting", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({ data: details, error: null });

    renderPage("?authorization_id=auth-123");

    // The client name has to reach the user — approving an unnamed app is the
    // failure mode this page exists to prevent.
    expect(await screen.findByText("oauthConsent.title:Claude")).toBeInTheDocument();
    expect(screen.getByText("oauthConsent.subtitleWithHousehold:Team Kitchen")).toBeInTheDocument();

    // Deletion is permanent and no scope string conveys it, so it must be listed.
    expect(screen.getByText("oauthConsent.permissionRead")).toBeInTheDocument();
    expect(screen.getByText("oauthConsent.permissionWrite")).toBeInTheDocument();
    expect(screen.getByText("oauthConsent.permissionDelete")).toBeInTheDocument();
    expect(screen.getByText("oauthConsent.permissionHousehold")).toBeInTheDocument();
  });

  it("falls back to the household-less subtitle when no household is loaded", async () => {
    mocks.household = null;
    mocks.getAuthorizationDetails.mockResolvedValue({ data: details, error: null });

    renderPage("?authorization_id=auth-123");

    expect(await screen.findByText("oauthConsent.subtitle")).toBeInTheDocument();
  });

  it("sends the user back to the client after approving", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({ data: details, error: null });
    mocks.approveAuthorization.mockResolvedValue({
      data: { redirect_url: "https://claude.ai/api/mcp/auth_callback?code=abc" },
      error: null,
    });

    renderPage("?authorization_id=auth-123");
    await userEvent.click(await screen.findByRole("button", { name: "oauthConsent.approve" }));

    await waitFor(() =>
      expect(mocks.redirectTo).toHaveBeenCalledWith("https://claude.ai/api/mcp/auth_callback?code=abc"),
    );
    expect(mocks.approveAuthorization).toHaveBeenCalledWith("auth-123", {
      skipBrowserRedirect: true,
    });
  });

  it("denies through the OAuth server rather than just navigating away", async () => {
    // Denial has to reach the client as access_denied; silently closing the tab
    // would leave the connector waiting.
    mocks.getAuthorizationDetails.mockResolvedValue({ data: details, error: null });
    mocks.denyAuthorization.mockResolvedValue({
      data: { redirect_url: "https://claude.ai/api/mcp/auth_callback?error=access_denied" },
      error: null,
    });

    renderPage("?authorization_id=auth-123");
    await userEvent.click(await screen.findByRole("button", { name: "oauthConsent.deny" }));

    await waitFor(() =>
      expect(mocks.redirectTo).toHaveBeenCalledWith(
        "https://claude.ai/api/mcp/auth_callback?error=access_denied",
      ),
    );
  });

  it("redirects straight through when the user already consented", async () => {
    // Supabase returns a finished redirect instead of details in that case.
    mocks.getAuthorizationDetails.mockResolvedValue({
      data: { redirect_url: "https://claude.ai/api/mcp/auth_callback?code=xyz" },
      error: null,
    });

    renderPage("?authorization_id=auth-123");

    await waitFor(() =>
      expect(mocks.redirectTo).toHaveBeenCalledWith("https://claude.ai/api/mcp/auth_callback?code=xyz"),
    );
    expect(screen.queryByRole("button", { name: "oauthConsent.approve" })).not.toBeInTheDocument();
  });

  it("explains a missing authorization_id without calling the server", async () => {
    renderPage("");

    expect(await screen.findByText("oauthConsent.missingRequest")).toBeInTheDocument();
    expect(mocks.getAuthorizationDetails).not.toHaveBeenCalled();
  });

  it("shows no consent buttons when the request is expired or invalid", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({ data: null, error: { status: 400 } });

    renderPage("?authorization_id=stale");

    expect(await screen.findByText("oauthConsent.loadFailed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "oauthConsent.approve" })).not.toBeInTheDocument();
  });

  it("tells the user their session expired rather than blaming the request", async () => {
    // A dead Plateful session 403s on the same call a bad authorization_id does.
    // Reporting it as "invalid connection request" sends people off re-adding a
    // connector that was never broken — which is exactly what happened in prod.
    mocks.getAuthorizationDetails.mockResolvedValue({
      data: null,
      error: { status: 403, code: "session_not_found" },
    });

    renderPage("?authorization_id=auth-123");

    expect(await screen.findByText("oauthConsent.sessionExpired")).toBeInTheDocument();
    expect(screen.queryByText("oauthConsent.loadFailed")).not.toBeInTheDocument();
  });

  it("offers a sign-in that preserves the pending authorization", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({
      data: null,
      error: { status: 401 },
    });

    renderPage("?authorization_id=auth-123");
    await userEvent.click(await screen.findByRole("button", { name: "oauthConsent.signInAgain" }));

    // Signing out drops the route to the sign-in screen without touching the URL,
    // so the authorization_id survives and consent resumes after logging in.
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it("keeps the user on the page when the decision fails", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({ data: details, error: null });
    mocks.approveAuthorization.mockResolvedValue({ data: null, error: new Error("boom") });

    renderPage("?authorization_id=auth-123");
    await userEvent.click(await screen.findByRole("button", { name: "oauthConsent.approve" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("oauthConsent.decisionFailed"));
    expect(mocks.redirectTo).not.toHaveBeenCalled();
    // Re-enabled, so the user can retry rather than being stuck on a dead button.
    expect(screen.getByRole("button", { name: "oauthConsent.approve" })).toBeEnabled();
  });
});
