import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSheetInVisualViewport } from "./useSheetInVisualViewport";

class FakeViewport extends EventTarget {
  height = 714;
  offsetTop = 0;
}

let viewport: FakeViewport;
let sheet: HTMLDivElement;

function change(values: Partial<Pick<FakeViewport, "height" | "offsetTop">>, type = "resize") {
  act(() => {
    Object.assign(viewport, values);
    viewport.dispatchEvent(new Event(type));
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  viewport = new FakeViewport();
  Object.defineProperty(window, "visualViewport", { value: viewport, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 714, configurable: true });
  sheet = document.body.appendChild(document.createElement("div"));
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

function open() {
  const hook = renderHook(({ isOpen }) => useSheetInVisualViewport({ current: sheet }, isOpen), {
    initialProps: { isOpen: true },
  });
  act(() => {
    vi.advanceTimersToNextFrame();
  });
  return hook;
}

describe("useSheetInVisualViewport", () => {
  it("leaves the sheet alone while the whole window is visible", () => {
    open();
    expect(sheet.style.bottom).toBe("");
    expect(sheet.style.maxHeight).toBe("");
  });

  // iPhone 17 Simulator, iOS 27, 2026-11-20: the keyboard left 384 of 714 px.
  it("stands the sheet on the keyboard and fits it into what is visible", () => {
    open();
    change({ height: 384 });
    expect(sheet.style.bottom).toBe("330px");
    expect(sheet.style.maxHeight).toBe("345px");
    expect(sheet.style.minHeight).toBe("0px");
    expect(sheet.style.getPropertyValue("--keyboard-bar")).toBe("32px");
  });

  it("follows Safari when it has scrolled the page anyway", () => {
    open();
    change({ height: 384 });
    change({ offsetTop: 185 }, "scroll");
    expect(sheet.style.bottom).toBe("145px");
    change({ offsetTop: 330 }, "scroll");
    expect(sheet.style.bottom).toBe("0px");
  });

  it("lets go once the keyboard is gone or the sheet closes", () => {
    const { rerender } = open();
    change({ height: 384 });
    change({ height: 714 });
    expect(sheet.style.bottom).toBe("");

    change({ height: 384 });
    rerender({ isOpen: false });
    expect(sheet.style.bottom).toBe("");
    expect(sheet.style.maxHeight).toBe("");
    expect(sheet.style.minHeight).toBe("");
    expect(sheet.style.getPropertyValue("--keyboard-bar")).toBe("");
  });
});
