import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InviteRoute from "./InviteRoute";
import { PostSignInLanding } from "./OAuthConsentRoute";
import { APP_STORE_URL } from "@/lib/appStores";
import { peekPendingInvite, rememberPendingInvite } from "@/lib/pendingInvite";
import { peekPendingConsent, rememberPendingConsent } from "@/lib/pendingOAuthConsent";

const platform = vi.hoisted(() => ({ native: false }));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => platform.native },
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/page/onboarding/signUp/SignUp", () => ({
  default: ({ variant }: { variant?: string }) => (
    <div>sign-in screen:{variant ?? "onboarding"}</div>
  ),
}));
vi.mock("@/page/InvitePage", () => ({ default: () => <div>invite page</div> }));
vi.mock("@/page/OAuthConsent", () => ({ default: () => <div>consent screen</div> }));

const ANDROID = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130 Mobile";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130";

function useAgent(userAgent: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
}

function renderAt(path: string, loggedIn: boolean) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/invite/:token"
          element={<InviteRoute isLoggedIn={loggedIn} refreshUser={async () => true} />}
        />
        <Route path="/oauth/consent" element={<div>consent screen</div>} />
        <Route path="/" element={<PostSignInLanding />} />
        <Route path="/home" element={<div>home screen</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  platform.native = false;
});
afterEach(() => vi.restoreAllMocks());

describe("InviteRoute signed out", () => {
  it("offers the Android app first, with this invite and Google Play as fallback", () => {
    useAgent(ANDROID);
    renderAt("/invite/abc123", false);

    const link = screen.getByRole("link", { name: "invitePage.continueInApp" });
    expect(link.getAttribute("href")).toMatch(
      /^intent:\/\/app\.plateful\.cloud\/invite\/abc123#Intent;.*package=com\.kblanks\.plateful;S\.browser_fallback_url=https%3A%2F%2Fplay\.google\.com/
    );
    expect(screen.queryByText(/sign-in screen/)).toBeNull();
  });

  it("sends an iPhone to the App Store", () => {
    useAgent(IPHONE);
    renderAt("/invite/abc123", false);

    expect(
      screen.getByRole("link", { name: "invitePage.continueInApp" }).getAttribute("href")
    ).toBe(APP_STORE_URL);
  });

  it("keeps web sign-in one tap away, framed as an invite", () => {
    useAgent(ANDROID);
    renderAt("/invite/abc123", false);

    fireEvent.click(screen.getByRole("button", { name: "invitePage.continueInBrowser" }));

    expect(screen.getByText("sign-in screen:invite")).toBeInTheDocument();
  });

  it("goes straight to sign-in on a desktop, where there is no app to hand off to", () => {
    useAgent(DESKTOP);
    renderAt("/invite/abc123", false);

    expect(screen.getByText("sign-in screen:invite")).toBeInTheDocument();
  });

  it("goes straight to sign-in inside the Android app", () => {
    useAgent(ANDROID);
    platform.native = true;
    renderAt("/invite/abc123", false);

    expect(screen.getByText("sign-in screen:invite")).toBeInTheDocument();
  });

  it("remembers the invite for the email path", () => {
    useAgent(DESKTOP);
    renderAt("/invite/abc123", false);

    expect(peekPendingInvite()).toBe("/invite/abc123");
  });
});

describe("InviteRoute signed in", () => {
  it("shows the invite page and forgets the remembered invite", () => {
    rememberPendingInvite("abc123");
    renderAt("/invite/abc123", true);

    expect(screen.getByText("invite page")).toBeInTheDocument();
    // Otherwise joining (which navigates to "/") would land on the invite again.
    expect(peekPendingInvite()).toBeNull();
  });
});

describe("PostSignInLanding with a pending invite", () => {
  it("returns a magic-link sign-in to the invite", () => {
    rememberPendingInvite("abc123");
    renderAt("/", true);

    expect(screen.getByText("invite page")).toBeInTheDocument();
    expect(peekPendingInvite()).toBeNull();
  });

  it("serves a pending consent first and keeps the invite for later", () => {
    rememberPendingInvite("abc123");
    rememberPendingConsent("?authorization_id=xyz");
    renderAt("/", true);

    expect(screen.getByText("consent screen")).toBeInTheDocument();
    expect(peekPendingConsent()).toBeNull();
    expect(peekPendingInvite()).toBe("/invite/abc123");
  });
});
