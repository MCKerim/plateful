import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OAuthConsentRoute, { PostSignInLanding } from "./OAuthConsentRoute";
import { peekPendingConsent, rememberPendingConsent } from "@/lib/pendingOAuthConsent";

vi.mock("@/page/onboarding/signUp/SignUp", () => ({
  default: () => <div>sign-in screen</div>,
}));
vi.mock("@/page/OAuthConsent", () => ({
  default: () => <div>consent screen</div>,
}));

function renderAt(path: string, loggedIn: boolean) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/oauth/consent" element={<OAuthConsentRoute isLoggedIn={loggedIn} />} />
        <Route path="/" element={<PostSignInLanding />} />
        <Route path="/home" element={<div>home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OAuthConsentRoute", () => {
  beforeEach(() => localStorage.clear());

  it("shows consent to a signed-in user", () => {
    renderAt("/oauth/consent?authorization_id=abc", true);

    expect(screen.getByText("consent screen")).toBeInTheDocument();
    // Nothing to remember — they never left.
    expect(peekPendingConsent()).toBeNull();
  });

  it("shows sign-in in place and remembers the request when signed out", () => {
    renderAt("/oauth/consent?authorization_id=abc", false);

    expect(screen.getByText("sign-in screen")).toBeInTheDocument();
    // Choosing "continue with email" navigates away from this URL, so the
    // request has to be stashed before that happens or it is simply lost.
    expect(peekPendingConsent()).toBe("/oauth/consent?authorization_id=abc");
  });
});

describe("PostSignInLanding", () => {
  beforeEach(() => localStorage.clear());

  it("goes to the home screen normally", () => {
    renderAt("/", true);

    expect(screen.getByText("home screen")).toBeInTheDocument();
  });

  it("returns to a pending consent instead of the home screen", () => {
    // Where the magic link lands: Supabase sends the user to "/", and without
    // this they'd never get back to the connector request they started.
    rememberPendingConsent("?authorization_id=abc");

    renderAt("/", true);

    expect(screen.getByText("consent screen")).toBeInTheDocument();
  });

  it("clears the pending request once it has been used", () => {
    rememberPendingConsent("?authorization_id=abc");

    renderAt("/", true);

    // Otherwise the next ordinary sign-in would be hijacked back to a consent
    // request that has long since been answered.
    expect(peekPendingConsent()).toBeNull();
  });
});
