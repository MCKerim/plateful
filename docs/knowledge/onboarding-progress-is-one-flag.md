# Onboarding progress is one flag, so a new device replays it

Checked 2026-10-19 against HEAD `c4645b2` and the production logs of an invitee on 2026-10-18.

The router knows only `users.has_completed_survey`, and only `ChooseUsername` (`/choosename`, after question 9 and `/values/2`) sets it to true (`userApi.completeOnboarding`). `routeToCorrectPagePure` sends every signed-in user without it to `/values/1`. The answers in `survey_answers` are saved per question and prefill one screen at a time (`Survey.tsx` `loadExistingAnswer`), but nothing reads them to skip ahead. Someone who stops after question 4 and signs in on another device (web, then the Android app) clicks through Welcome, sign-up, the value screens and questions 1 to 4 again, then answers 5 to 9.

The resume screen `SurveyStart` ("Continue where you left off" at `/survey`) still exists but is unreachable since commit `95701f5` (2026-02-13, "remove survey step"); nothing navigates to plain `/survey`.

Invitees take the same path once they sign in on the web. Signed out in a phone browser, `/invite/:token` offers the app first since `cbdf004` (2026-10-22, see [invite-link-handoff.md](invite-link-handoff.md)); before that it rendered the generic `SignUp` in place. After Join, `InvitePage` goes to `/` and the survey gate comes before the household gate, so a member of a premium household still answers all nine questions and picks a name. The invitee skips the paywall only because `/createhousehold` redirects members to `/home` and `isPro()` is true there. An invitee to a non-premium household gets the full trial and paywall chain.

Side effects worth knowing:

- Google and Apple sign-in on the web are popups, so the tab stays on `/invite/:token` and the join works. Email sign-up lost the invite until `cbdf004`; the token is now remembered across the magic link (see [invite-link-handoff.md](invite-link-handoff.md)).
- `household_joined` is captured only in `InvitePage` after a successful accept. A join on the web with PostHog blocked (no reverse proxy, the 2026-10-18 invitee used Firefox for Android) leaves no event anywhere, and the later Android session never re-accepts.
- The full invite token appears in `$current_url` / `$pathname` of any web PostHog event fired on `/invite/:token`; it is a capability token valid for 24 hours.
- Supabase `edge_logs` keep the user agent and referer per request for 24 hours; they show which surface (browser, WebView, iOS) a session really used when PostHog has nothing.
