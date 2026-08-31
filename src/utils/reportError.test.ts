import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ captureException: vi.fn() }));

vi.mock("posthog-js", () => ({
  default: { captureException: mocks.captureException },
}));

const { reportError, markReported } = await import("./reportError");

describe("reportError", () => {
  beforeEach(() => {
    mocks.captureException.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("reports to PostHog with the message as the source", () => {
    const error = new Error("boom");
    reportError("Failed to save recipe", error);

    expect(mocks.captureException).toHaveBeenCalledOnce();
    const [captured, props] = mocks.captureException.mock.calls[0];
    expect(captured).toBe(error);
    expect(props).toMatchObject({ source: "Failed to save recipe" });
  });

  it("merges extra context alongside the source", () => {
    reportError("Import failed", new Error("boom"), { import_type: "url" });
    expect(mocks.captureException.mock.calls[0][1]).toMatchObject({
      source: "Import failed",
      import_type: "url",
    });
  });

  /**
   * Supabase and the Capacitor plugins reject with plain objects and strings.
   * captureException needs a real Error or the event arrives with no message.
   */
  it("normalizes a non-Error rejection into an Error", () => {
    reportError("Plugin failed", "something went wrong");

    const [captured] = mocks.captureException.mock.calls[0];
    expect(captured).toBeInstanceOf(Error);
    expect((captured as Error).message).toBe("something went wrong");
  });

  it("still logs to the console", () => {
    const error = new Error("boom");
    reportError("Failed to save recipe", error);
    expect(console.error).toHaveBeenCalledWith("Failed to save recipe:", error);
  });

  /**
   * The one that keeps mutation failures from being filed twice: MutationCache
   * reports and marks, then the caller's own catch block calls reportError on
   * the same object.
   */
  it("does not re-report an error already filed by the MutationCache", () => {
    const error = new Error("mutation blew up");
    markReported(error);

    reportError("Failed to delete collection", error);

    expect(mocks.captureException).not.toHaveBeenCalled();
    // ...but the console still shows it, so local debugging is unchanged.
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("reports a different error even after another was marked", () => {
    markReported(new Error("already filed"));
    reportError("Failed to save recipe", new Error("fresh failure"));
    expect(mocks.captureException).toHaveBeenCalledOnce();
  });

  /** A thrown string can't be marked; reporting it is the safe default. */
  it("reports non-object throws rather than silently dropping them", () => {
    markReported("a string");
    reportError("Plugin failed", "a string");
    expect(mocks.captureException).toHaveBeenCalledOnce();
  });
});
