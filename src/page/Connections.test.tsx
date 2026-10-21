import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import Connections from "./Connections";

const mocks = vi.hoisted(() => ({
  writeClipboardText: vi.fn(() => Promise.resolve()),
  capture: vi.fn(),
}));

vi.mock("@/utils/nativeClipboard", () => ({ writeClipboardText: mocks.writeClipboardText }));
vi.mock("posthog-js/react", () => ({ usePostHog: () => ({ capture: mocks.capture }) }));
vi.mock("@/components/layout/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const keyWrappingTranslation = { t: (key: string) => `«${key}»` };
vi.mock("react-i18next", () => ({ useTranslation: () => keyWrappingTranslation }));

function renderPage() {
  return render(
    <MemoryRouter>
      <Connections />
    </MemoryRouter>,
  );
}

describe("Connections", () => {
  it("links Claude to the documented install URL with the server address fully encoded", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "«connections.connectClaude»" })).toHaveAttribute(
      "href",
      "https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Plateful&connectorUrl=https%3A%2F%2Fmcp.plateful.cloud%2Fmcp",
    );
  });

  it("links ChatGPT to the Plateful plugin page", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "«connections.connectChatGPT»" })).toHaveAttribute(
      "href",
      "https://chatgpt.com/plugins/plateful",
    );
  });

  it("copies exactly the prompt text the row shows", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "«connections.promptTonight»" }));
    expect(mocks.writeClipboardText).toHaveBeenCalledExactlyOnceWith("«connections.promptTonight»");
  });
});
