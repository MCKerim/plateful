import { act, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useBackButton, useBackButtonListener } from "./useBackButton";

let onBack: (event: { canGoBack: boolean }) => void = () => {};

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (_: string, cb: typeof onBack) => {
      onBack = cb;
      return Promise.resolve({ remove: () => {} });
    },
  },
}));

function Page({ onPageBack }: { onPageBack?: () => void }) {
  useBackButtonListener();
  const [open, setOpen] = useState(true);
  return (
    <>
      {onPageBack && <PageHandler handler={onPageBack} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Plan</DialogTitle>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PageHandler({ handler }: { handler: () => void }) {
  useBackButton(handler);
  return null;
}

describe("useBackButtonListener", () => {
  afterEach(() => vi.restoreAllMocks());

  it("closes an open dialog first and only then goes back", () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const { queryByRole } = render(<Page />);
    expect(queryByRole("dialog")).not.toBeNull();

    act(() => onBack({ canGoBack: true }));
    expect(queryByRole("dialog")).toBeNull();
    expect(back).not.toHaveBeenCalled();

    act(() => onBack({ canGoBack: true }));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("runs the page's own handler instead of going back", () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const pageBack = vi.fn();
    render(<Page onPageBack={pageBack} />);

    act(() => onBack({ canGoBack: true }));
    expect(pageBack).not.toHaveBeenCalled();
    act(() => onBack({ canGoBack: true }));
    expect(pageBack).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();
  });
});
