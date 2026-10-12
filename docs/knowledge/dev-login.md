# Dev login: the test household without a mailbox

_Dev builds show a "Dev-Login" link on `/login` when `.env.local` holds `VITE_DEV_EMAIL` and `VITE_DEV_PASSWORD` (the iOS repo's `DevConfig.swift` test account `dev@plateful.test`); `src/lib/devSignIn.ts` is null in production builds, so nothing ships._

Since 2026-10-12. Production sign-in is a magic link or Google, which an agent driving the browser cannot complete; the review accounts need their own passwords. The dev account's credentials live only in the git-ignored `.env.local` (`*.local` is ignored) and the iOS repo's git-ignored `DevConfig.swift`. To set it up, copy `testEmail` / `testPassword` from there into `.env.local` as the two variables; Vite restarts the dev server on the change. The account cooks, plans and shops against the production project in its own household, like the iOS Dev Menu does.
