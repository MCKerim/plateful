import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useKeyboardOpen } from "./useKeyboardOpen";

class FakeViewport extends EventTarget {
  width = 360;
  height = 732;
}

let viewport: FakeViewport;

function resize(size: Partial<Pick<FakeViewport, "width" | "height">>) {
  act(() => {
    Object.assign(viewport, size);
    viewport.dispatchEvent(new Event("resize"));
  });
}

function focusField() {
  document.body.appendChild(document.createElement("input")).focus();
}

beforeEach(() => {
  viewport = new FakeViewport();
  Object.defineProperty(window, "visualViewport", { value: viewport, configurable: true });
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useKeyboardOpen", () => {
  it("is open while the keyboard of a focused field takes the bottom of the screen", () => {
    const { result } = renderHook(() => useKeyboardOpen());
    focusField();

    resize({ height: 453 });
    expect(result.current).toBe(true);

    resize({ height: 732 });
    expect(result.current).toBe(false);
  });

  it("stays closed when a window gets shorter with no field focused", () => {
    const { result } = renderHook(() => useKeyboardOpen());

    resize({ height: 453 });
    expect(result.current).toBe(false);
  });

  it("stays closed when a browser's address bar comes back", () => {
    const { result } = renderHook(() => useKeyboardOpen());
    focusField();

    resize({ height: 676 });
    expect(result.current).toBe(false);
  });

  it("stays closed while pinch-zoomed", () => {
    const { result } = renderHook(() => useKeyboardOpen());
    focusField();

    resize({ width: 180, height: 366 });
    expect(result.current).toBe(false);
  });

  it("measures a turned phone against its own height", () => {
    const { result } = renderHook(() => useKeyboardOpen());
    focusField();

    resize({ width: 732, height: 360 });
    expect(result.current).toBe(false);

    resize({ height: 160 });
    expect(result.current).toBe(true);
  });
});
