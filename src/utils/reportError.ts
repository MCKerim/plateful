import posthog from "posthog-js";

/**
 * Errors already filed by `MutationCache.onError` in `main.tsx`.
 *
 * A `try { await x.mutateAsync() } catch` block usually also catches plain API
 * calls, so "does this catch a mutation?" has no one answer per site — the same
 * handler can receive a failure that is already reported and one that isn't.
 * Marking the error object itself settles it per *failure* instead of per call
 * site, so `reportError` can be used anywhere without thinking about it and a
 * mutation failure is still filed exactly once.
 *
 * Weak, so a marked error is collectable as normal. Non-objects (a thrown
 * string) can't be marked and are simply always reported.
 */
const alreadyReported = new WeakSet<object>();

/** Records that `error` has been reported, so `reportError` won't file it again. */
export function markReported(error: unknown): void {
  if (error !== null && typeof error === "object") alreadyReported.add(error);
}

/**
 * Logs a failure to the console **and** reports it to PostHog, in one call.
 *
 * Use this instead of a bare `console.error` anywhere a failure is caught. The
 * two jobs are welded together on purpose: for months this app had 58
 * `console.error` sites and a purpose-built `useErrorTracking` hook that nothing
 * imported, so every caught failure outside a React Query *read* — onboarding,
 * auth, imports, chatbot, invites, and the entire RevenueCat layer — was visible
 * only in a console nobody was attached to. The paywall was the worst of it: it
 * captured the purchase *success* event and console-logged the failure, so the
 * data showed every purchase that worked and none that broke.
 *
 * `message` doubles as the `source` property, which is what makes one site
 * distinguishable from another in the dashboard, so keep it specific and stable.
 *
 * Safe to call on a failure that came out of a mutation: `MutationCache.onError`
 * marks what it has already filed, and this skips those rather than filing them
 * twice. It still logs, so the console reads the same either way. The one place
 * to leave alone is a mutation's own `onError` handler, where the cache has
 * always already reported and a call here would be pure noise.
 */
export function reportError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  console.error(`${message}:`, error);
  if (error !== null && typeof error === "object" && alreadyReported.has(error)) return;
  // captureException wants a real Error — Supabase and the Capacitor plugins
  // both reject with plain objects and strings, which would otherwise arrive as
  // an unreadable event with no message and no stack.
  const normalized = error instanceof Error ? error : new Error(String(error));
  posthog.captureException(normalized, { source: message, ...context });
}
