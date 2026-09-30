import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SignUp from "./SignUp";
import { spendPendingSignIn } from "@/lib/pendingSignIn";

// jsdom ships `getRandomValues` but no SubtleCrypto; the screen hashes its
// nonce with `crypto.subtle.digest`.
if (!globalThis.crypto.subtle) {
  Object.defineProperty(globalThis.crypto, "subtle", {
    value: webcrypto.subtle,
    configurable: true,
  });
}

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  login: vi.fn(),
  isNativePlatform: vi.fn(() => false),
  signInWithIdToken: vi.fn(),
  updateUser: vi.fn(),
  toastError: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock("@capgo/capacitor-social-login", () => ({
  SocialLogin: { initialize: mocks.initialize, login: mocks.login },
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}));

// Module-level constants: `useSupabase` and `useTranslation` feed effects and
// callbacks, and a fresh identity per render would re-fire them.
const supabaseValue = {
  supabase: {
    auth: { signInWithIdToken: mocks.signInWithIdToken, updateUser: mocks.updateUser },
  },
};
vi.mock("@/utils/supabase", () => ({ useSupabase: () => supabaseValue }));
const translation = { t: (key: string) => key };
vi.mock("react-i18next", () => ({ useTranslation: () => translation }));
const tracking = { trackScreenViewed: vi.fn() };
vi.mock("@/hooks/analytics/useOnboardingTracking", () => ({
  useOnboardingTracking: () => tracking,
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));
vi.mock("@/utils/reportError", () => ({ reportError: mocks.reportError }));
// The intro overlay only animates; the buttons under it are what's tested.
vi.mock("@/components/general/CircleTransition", () => ({ default: () => null }));

const appleResult = (profile: Partial<{ givenName: string | null; familyName: string | null }> = {}) => ({
  provider: "apple" as const,
  result: {
    accessToken: null,
    idToken: "apple-id-token",
    profile: { user: "", email: null, givenName: null, familyName: null, ...profile },
  },
});

function renderScreen() {
  return render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>,
  );
}

const appleButton = () => screen.getByRole("button", { name: "signup.continueWithApple" });
const googleButton = () => screen.getByRole("button", { name: "signup.continueWithGoogle" });

beforeEach(() => {
  vi.stubEnv("VITE_APPLE_SERVICES_ID", "com.kblanks.plateful.web");
  mocks.isNativePlatform.mockReturnValue(false);
  mocks.initialize.mockResolvedValue(undefined);
  mocks.signInWithIdToken.mockResolvedValue({ error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
  spendPendingSignIn(); // drop anything a previous test left behind
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("SignUp: which providers are offered", () => {
  it("offers Google, Apple and e-mail on the web and initializes both providers", () => {
    renderScreen();

    expect(googleButton()).toBeInTheDocument();
    expect(appleButton()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "signup.continueWithEMail" })).toBeInTheDocument();

    expect(mocks.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        apple: {
          clientId: "com.kblanks.plateful.web",
          redirectUrl: `${globalThis.location.origin}/signup`,
        },
      }),
    );
  });

  it("hides Apple on a native platform (Android) and leaves it out of initialize", () => {
    mocks.isNativePlatform.mockReturnValue(true);
    renderScreen();

    expect(screen.queryByRole("button", { name: "signup.continueWithApple" })).toBeNull();
    expect(mocks.initialize).toHaveBeenCalledWith(expect.not.objectContaining({ apple: expect.anything() }));
  });

  it("hides Apple when no Services ID is configured", () => {
    vi.stubEnv("VITE_APPLE_SERVICES_ID", "");
    renderScreen();

    expect(screen.queryByRole("button", { name: "signup.continueWithApple" })).toBeNull();
    expect(googleButton()).toBeInTheDocument();
  });
});

describe("SignUp: Sign in with Apple", () => {
  it("exchanges Apple's ID token for a Supabase session with the raw nonce", async () => {
    mocks.login.mockResolvedValue(appleResult());
    renderScreen();

    await userEvent.click(appleButton());

    await waitFor(() => expect(mocks.signInWithIdToken).toHaveBeenCalledTimes(1));
    const loginCall = mocks.login.mock.calls[0][0];
    expect(loginCall.provider).toBe("apple");
    expect(loginCall.options.scopes).toEqual(["name", "email"]);

    const supabaseCall = mocks.signInWithIdToken.mock.calls[0][0];
    expect(supabaseCall).toMatchObject({ provider: "apple", token: "apple-id-token" });
    // Apple receives the digest, Supabase the raw value it hashes to.
    const digestOfRaw = createHash("sha256").update(supabaseCall.nonce).digest("hex");
    expect(loginCall.options.nonce).toBe(digestOfRaw);

    // Owed to the auth bootstrap, which captures `signed_in` after identify.
    expect(spendPendingSignIn()).toBe("apple");
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("stays quiet when the person closes the Apple popup", async () => {
    mocks.login.mockRejectedValue({ error: "popup_closed_by_user" });
    renderScreen();

    await userEvent.click(appleButton());

    await waitFor(() => expect(mocks.login).toHaveBeenCalledTimes(1));
    expect(mocks.signInWithIdToken).not.toHaveBeenCalled();
    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.reportError).not.toHaveBeenCalled();
    expect(spendPendingSignIn()).toBeNull();
  });

  it("stores the name Apple sends on the first authorization", async () => {
    mocks.login.mockResolvedValue(appleResult({ givenName: "Kerim", familyName: "Ismail Oglou" }));
    renderScreen();

    await userEvent.click(appleButton());

    await waitFor(() =>
      expect(mocks.updateUser).toHaveBeenCalledWith({ data: { full_name: "Kerim Ismail Oglou" } }),
    );
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("does not write a name when Apple sends none (every later sign-in)", async () => {
    mocks.login.mockResolvedValue(appleResult());
    renderScreen();

    await userEvent.click(appleButton());

    await waitFor(() => expect(mocks.signInWithIdToken).toHaveBeenCalledTimes(1));
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("keeps the session when storing the name fails", async () => {
    mocks.login.mockResolvedValue(appleResult({ givenName: "Kerim", familyName: null }));
    mocks.updateUser.mockResolvedValue({ error: new Error("metadata write failed") });
    renderScreen();

    await userEvent.click(appleButton());

    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ data: { full_name: "Kerim" } }));
    expect(mocks.reportError).toHaveBeenCalledWith(
      "Failed to store the name from Sign in with Apple",
      expect.any(Error),
    );
    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(spendPendingSignIn()).toBe("apple");
  });

  it("reports a Supabase rejection and clears the owed sign-in", async () => {
    mocks.login.mockResolvedValue(appleResult());
    mocks.signInWithIdToken.mockResolvedValue({ error: new Error("Unacceptable audience in id_token") });
    renderScreen();

    await userEvent.click(appleButton());

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledTimes(1));
    expect(mocks.reportError).toHaveBeenCalledWith("Unexpected error during sign up", expect.any(Error));
    expect(spendPendingSignIn()).toBeNull();
  });
});

describe("SignUp: Google keeps working through the shared flow", () => {
  it("exchanges Google's ID token the same way and owes a `google` sign-in", async () => {
    mocks.login.mockResolvedValue({
      provider: "google",
      result: { idToken: "google-id-token", accessToken: null, profile: {} },
    });
    renderScreen();

    await userEvent.click(googleButton());

    await waitFor(() => expect(mocks.signInWithIdToken).toHaveBeenCalledTimes(1));
    expect(mocks.login.mock.calls[0][0].provider).toBe("google");
    expect(mocks.signInWithIdToken.mock.calls[0][0]).toMatchObject({
      provider: "google",
      token: "google-id-token",
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(spendPendingSignIn()).toBe("google");
  });
});
