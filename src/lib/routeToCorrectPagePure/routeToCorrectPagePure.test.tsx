import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { routeToCorrectPagePure } from "./routeToCorrectPagePure";

// Mock the SignUp component
vi.mock("@/page/onboarding/signUp/SignUp", () => ({
  default: () => <div data-testid="signup-page">SignUp</div>,
}));

// Mock Navigate component to be testable
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => (
      <div data-testid="navigate" data-to={to}>
        Navigate to {to}
      </div>
    ),
  };
});

describe("routeToCorrectPagePure", () => {
  const TestPage = () => <div data-testid="test-page">Test Page</div>;

  const renderWithRouter = (element: React.ReactElement) => {
    return render(<BrowserRouter>{element}</BrowserRouter>);
  };

  it("should show SignUp when not logged in", () => {
    const result = routeToCorrectPagePure(
      <TestPage />,
      () => false, // not logged in
      () => true,
      () => true,
      () => true
    );

    renderWithRouter(result);
    expect(screen.getByTestId("signup-page")).toBeInTheDocument();
  });

  it("should redirect to /values/1 when logged in but has not seen value screens", () => {
    const result = routeToCorrectPagePure(
      <TestPage />,
      () => true, // logged in
      () => false, // has not seen value screens
      () => true,
      () => true
    );

    renderWithRouter(result);
    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-to",
      "/values/1"
    );
  });

  it("should redirect to /survey when logged in, seen values, but not completed survey", () => {
    const result = routeToCorrectPagePure(
      <TestPage />,
      () => true, // logged in
      () => true, // seen value screens
      () => false, // not completed survey
      () => true
    );

    renderWithRouter(result);
    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/survey");
  });

  it("should redirect to /createhousehold when logged in, seen values, completed survey, but no household", () => {
    const result = routeToCorrectPagePure(
      <TestPage />,
      () => true, // logged in
      () => true, // seen value screens
      () => true, // completed survey
      () => false // no household
    );

    renderWithRouter(result);
    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-to",
      "/createhousehold"
    );
  });

  it("should render the page when all conditions are met", () => {
    const result = routeToCorrectPagePure(
      <TestPage />,
      () => true, // logged in
      () => true, // seen value screens
      () => true, // completed survey
      () => true // has household
    );

    renderWithRouter(result);
    expect(screen.getByTestId("test-page")).toBeInTheDocument();
  });

  it("should check conditions in the correct order (short-circuit evaluation)", () => {
    const isLoggedIn = vi.fn(() => false);
    const hasSeenValueScreens = vi.fn(() => true);
    const hasCompletedSurvey = vi.fn(() => true);
    const hasHousehold = vi.fn(() => true);

    routeToCorrectPagePure(
      <TestPage />,
      isLoggedIn,
      hasSeenValueScreens,
      hasCompletedSurvey,
      hasHousehold
    );

    // When not logged in, other checks should not be called
    expect(isLoggedIn).toHaveBeenCalled();
    expect(hasSeenValueScreens).not.toHaveBeenCalled();
    expect(hasCompletedSurvey).not.toHaveBeenCalled();
    expect(hasHousehold).not.toHaveBeenCalled();
  });

  it("should only check hasSeenValueScreens when logged in", () => {
    const isLoggedIn = vi.fn(() => true);
    const hasSeenValueScreens = vi.fn(() => false);
    const hasCompletedSurvey = vi.fn(() => true);
    const hasHousehold = vi.fn(() => true);

    routeToCorrectPagePure(
      <TestPage />,
      isLoggedIn,
      hasSeenValueScreens,
      hasCompletedSurvey,
      hasHousehold
    );

    expect(isLoggedIn).toHaveBeenCalled();
    expect(hasSeenValueScreens).toHaveBeenCalled();
    expect(hasCompletedSurvey).not.toHaveBeenCalled();
    expect(hasHousehold).not.toHaveBeenCalled();
  });
});
