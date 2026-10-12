# Cooking mode on Capacitor (web + Android)

Plan, 2026-10-12. Status: built on branch `cooking-mode` the same day as
Android 1.5 / 44, verified against production with the dev account; Kerim's
device test (alarms through Doze and a reboot, scroll snap) and the Play
upload are pending. Parity port of the
iOS cooking mode (iOS 1.0, built 2026-07-10 to 07-21 in four stages). The
iOS repo is the spec; this file names what is copied, what is adapted,
what Android cannot do, and the order.

Kerim's calls, 2026-10-12: Android 1.5 carries iOS stages 1 and 2 together
(screen, sessions, ingredients, timers, chips, pill, invite card). Android
push (FCM) is its own later project. No in-app rating at finish, parity
with iOS, where the rating push after eating replaced the modal.

## Why

iOS has cooked with a fullscreen step feed since launch. This app shows a
recipe's steps as markdown on the detail page and keeps the screen awake,
nothing more. Sessions live in the household, so cooking together only
works when both phones have the feature; Celine cooks on Android.

## The spec lives in the iOS repo

Read, in this order, before touching code (paths under
`~/programming/ios-native/plateful/`):

1. `docs/knowledge/cooking-mode.md` (448 lines; every mechanism and every
   decision with dates. What iOS rejected is rejected here too: no
   step checkmarks, no progress bar, no timer pause, no finish-together
   note, no bulk annotation backfill.)
2. `docs/cooking-mode-design.md` (north star, explicitly not a v1 scope),
   `docs/cooking-mode-plan.md` (schema, annotation contract, stages),
   `docs/cooking-mode-problems.md` (the 16 problems the design answers).
3. `plateful/Features/Cooking/`: `CookingStore.swift` (710 lines; resume,
   servings, timers, step), `ActiveCookingSessionsStore.swift` (580;
   household sessions, mine vs joinable, pill), `CookingSessionRows.swift`
   (275; the queries), `CookingTimerRows.swift` (190),
   `CookingTimerNotifications.swift` (83; alarm rules),
   `StepDurationScanner.swift` (143; the regex), `CookingStepView.swift`
   (533; tokenizer and chips), `CookingView.swift` (748; feed, header,
   cover), `CookingIngredientsSheet.swift`, `CookingTimersSheet.swift`,
   `CookingTimerAlerts.swift`, `CookingSessionPill.swift`;
   `plateful/Core/StepAnnotation.swift` (207; the validator);
   `plateful/Features/Home/CookingInviteCard.swift`.
4. `platefulTests/CookingTests.swift` (331 lines, 21 cases; port them as
   Vitest cases).

Not for this release: `CookingAskStore` / `CookingAskSheet` (stage 3),
`CookingPagerView` (stage 3), `CookingVoice*` (dropped),
`CookingLiveActivityController` and `PlatefulWidgets` (no Android
equivalent).

Product truth: `~/PersonalOS/business/products/plateful.md`, project
`~/PersonalOS/projects/plateful-kochmodus-android/`.

## Server: nothing to add

Everything is in production since July 2026 and platform-neutral. Types
regenerated here on 2026-10-11 already carry the four tables and
`recipe_instructions.annotation`. All four tables: household RLS, in the
realtime publication, replica identity full (deletes carry the row, so
stopping a timer and unchecking an ingredient sync).

| Table | Columns | Notes |
|---|---|---|
| `cooking_sessions` | `id, household_id, recipe_id, started_by, target_servings, status, started_at, ended_at` | `status` is `active`, `finished` or `abandoned`; `recipe_id` cascades on recipe delete |
| `cooking_session_participants` | PK `(session_id, user_id)`, `current_step_id, joined_at` | `current_step_id` → `recipe_instructions` ON DELETE SET NULL |
| `cooking_session_timers` | `id, session_id, step_id, label, ends_at, duration_seconds, paused_remaining_seconds, created_by, created_at` | `id` is client-minted; `step_id` SET NULL; `paused_remaining_seconds` is unused (no pause) |
| `cooking_session_checks` | PK `(session_id, ingredient_id)`, `checked_by, checked_at` | no FK on `ingredient_id` |

Plain table reads and writes, no RPC. The iOS queries are the contract:

| iOS | Query |
|---|---|
| `CookingSessionRow.fetchActive(recipeID, householdID)` | `cooking_sessions` where recipe, household, `status = active`, newest `started_at` first, one row |
| `create` | insert session with `target_servings`, then join |
| `end(sessionID, status)` | update `status`, `ended_at` |
| `updateServings` | update `target_servings` |
| `CookingParticipantRow.join / leave / updateCurrentStep` | upsert, delete, update own row |
| `CookingCheckRow.insert / delete` | one row per checked ingredient |
| `CookingTimerRow.start / reschedule(id, endsAt) / remove / removeAll(sessionID)` | insert with client id, update `ends_at`, delete |
| `ActiveSessionRow.fetch(householdID)` | `cooking_sessions` with `recipes(cover columns)` and `cooking_session_participants(user_id)` embedded, `status = active`; split into mine (a participant row is me) and joinable |

Server triggers that already react to Android rows: `tg_cooking_sessions_notify`
sends `cooking_started` on insert and queues the delayed rating push on
`active → finished` (`cooking_rating_pushes`, cron
`cooking-rating-push-dispatcher`). `send-push` is APNs-only, so Android
tokens simply get nothing; iOS members of the household still get theirs.
Nothing to disable.

Extractor: `POST https://extractor.plateful.cloud/api/annotate` (Bearer
JWT, household check) annotates a recipe's steps on demand. iOS calls it
after every save (`RecipeAnnotator.requestAnnotation`); this app must do
the same after every `instructionsApi.replaceAll` caller (`AddRecipe`,
`Chatbot` proposal save, `IngredientEditor`), fire and forget. Until then
an edited recipe shows regex timer chips only.

Edit mid-session: a save replaces step and ingredient rows with fresh ids.
The FKs are SET NULL, so a running session keeps its timers (label and
`ends_at` stay), the participant's step pointer resets (resume lands on
the first step), and checks point at ids that no longer exist (invisible).
Same on iOS; no client guard.

## Scope: Android 1.5 = iOS stages 1 and 2

### Stage 1: screen and sessions

- **Cook button** on the recipe detail, in the page's existing bottom
  action area: "Kochen" / "Weiterkochen" / "Mitkochen" from the
  household's active sessions (mine → continue, someone else's → join,
  none → start). Starting is instant, no setup screen. The detail's
  servings (`selectTargetServings`) seed the new session's
  `target_servings`.
- **Session rules** (`CookingStore`): reuse the household's active session
  for the recipe when `started_at` is under 24 h old, else end it as
  `abandoned` (its timers removed) and create a new one. Join = insert my
  participant row. The current step is saved per participant, debounced.
  Finish (last step) and the ✕ both *leave* (delete my row); the session
  ends (`finished` from Finish, `abandoned` from ✕) only when no
  participant remains (`CookingStore.leave(as:)`, remaining count errs
  toward keeping the session).
- **Cooking screen**, route `/cooking/:recipeId`, no bottom navigation,
  screen kept awake (`useWakeLock`):
  - Vertical step feed with CSS scroll snap (`scroll-snap-type: y
    mandatory`, `scroll-snap-align: center`, `scroll-snap-stop: always`
    so one flick moves one step, top and bottom padding ≈ 0.38 · height so
    the first and last step can centre). An IntersectionObserver on the
    centre band makes the landed step the current step. Current step full
    contrast, the others at 0.3 opacity with the **same font size and
    weight** (opacity alone carries focus; a weight change re-wraps lines).
    Section names as small dimmed labels. No progress bar, no checkmarks.
  - Cover card above step 1 at the image's own aspect; ambient background
    = the cover's average colour (1 × 1 canvas draw) as a soft gradient,
    brand wash when the image is unreadable.
  - Header: thumbnail + name (tap minimises and opens the recipe), servings
    line, ✕ top right.
  - Bottom bar: Timers, Ingredients, "Weiter" (last step: "Fertig").
    No Ask, no voice in 1.5.
  - Ingredients sheet (vaul `Drawer`, swipe to dismiss): servings stepper
    (shared `target_servings`, min 1), grouped list with check-off (shared
    rows, optimistic insert/delete), amounts from `useScaledIngredients`.
  - Android back button and the header tap minimise; the session persists.
- **"Kocht gerade" pill** above `BottomNav` on every tab while I have a
  joined active session: cover thumbnail, recipe name, next running timer.
  Tap opens the cooking screen. With two or more sessions the pill shows
  the last opened one; the others are reached through their recipe's
  "Weiterkochen" (the pager is stage 3). Hidden on the cooking route.
- **Home invite card** above "Today you planned": a household member's
  active session I have not joined, with cover, "Anna kocht …" (names from
  `users.username`) and a Join button. Nothing ambient for a session I
  have not joined, as on iOS.
- **Realtime**: three more `postgres_changes` subscriptions in `App.tsx`
  (`cooking_sessions`, `cooking_session_timers`, `cooking_session_checks`;
  `cooking_session_participants` is not in the publication, and one
  unpublished table fails the whole channel), no column filter,
  debounced invalidation of `queryKeys.cooking.*`, skipped while a cooking
  mutation is in flight (the shopping-list pattern).
- **Analytics**: `cooking_started`, `cooking_finished`,
  `cooking_abandoned`, `cooking_timer_started`, the iOS names from
  `Analytics.swift`, added to `src/lib/analyticsEvents.ts`.
- **Re-annotate on save**, see Server above.

### Stage 2: timers and chips

- **Step text**: a validated annotation (`reconstructs()` from
  `recipeShare.transformer.ts`, exported; v = 1, no unknown entity kinds,
  every placeholder used once, template plus entity texts rebuild
  `step_text` exactly) is tokenised from its template. Ingredient
  mentions render as accent-coloured prose with the emoji on the first
  word, **tokenised per word** so long names wrap (an atomic token ran off
  screen on iOS); tap the mention → popover with the scaled amount and prep
  note. Timer entities render as pill chips labelled with the surface
  `text` and start a timer named `label`. No pills for ingredients (ten
  pills in one step overwhelmed on device). An un-annotated step gets
  timer chips from the ported `StepDurationScanner` only; regex never
  overrides an annotation.
- **Timers**: client-minted id (`randomId()`), optimistic row before the
  write, `ends_at = now + seconds`, `duration_seconds`, `step_id`, `label`.
  Chip and timer meet on the start label. Chip states: idle (outlined),
  running (filled, countdown), finished (filled, checkmark). Row actions in
  a quiet menu: +1 min, +5 min, −1 min, Reset (Repeat once fired), Stop
  (Dismiss once fired). **No pause.** A 1 s ticker runs only while an
  un-fired running timer exists and stops itself. `soonestRunningTimer`
  excludes fired timers (a past `ends_at` in a range crashed iOS).
- **Timers sheet**: every timer of my sessions, manual add (minutes input
  pinned inline), tapping a finished row dismisses it, empty state keeps
  the sheet's height.
- **Alarms**, per device, for every timer of a session I joined
  (`@capacitor/local-notifications`): one pending notification at `ends_at`
  (`schedule({ at, allowWhileIdle: true })`, title "Timer abgelaufen",
  body "`label` · `recipe`", `extra: { type: 'cooking_timer', timer_id }`),
  scheduled **before** the row write. Reconcile on every timer change: a
  running timer gets exactly one pending alarm, a fired timer loses its
  pending one but keeps its delivered banner, an explicit Stop cancels
  both, session end cancels all. Notification ids are integers: a stable
  31-bit hash of the timer id. Tap opens the cooking screen (route the
  existing `localNotificationActionPerformed` handler by `extra.type`).
  Manifest: `USE_EXACT_ALARM` (Android 14+, no prompt, allowed for timer
  apps) and `SCHEDULE_EXACT_ALARM` (Android 12 and 13, surfaced through the
  plugin's `checkExactNotificationSetting`). Fire quietly without
  notification permission. Web gets the in-app ring only.
- **In-app ring** while the screen is open: banner and sound, the iOS
  `CookingTimerAlerts` behaviour; "Dismiss" clears it.

## Not ported, and why

- **Live Activity / Dynamic Island**: no Android equivalent reachable from
  Capacitor; an ongoing notification with a chronometer needs a custom
  plugin. Pill plus alarms cover the need. Revisit if a plugin appears.
- **Voice**: WebView speech recognition is unreliable and needs a
  community plugin. Decide after 1.5 feedback (Kerim, 2026-10-12).
- **Ask the recipe** (text and photo, `/api/ask` streaming) and the
  **multi-session pager**: stage 3, next release.
- **Cooking pushes** (`cooking_started`, `cooking_finished`, rating): the
  FCM project. Until then Android sees the invite card while the app is
  open and nothing when it is closed.
- **In-app rating at finish**: none, parity with iOS (Kerim, 2026-10-12).
- **Liquid Glass, haptics, native toolbars**: shadcn + Tailwind like the
  rest of the app.
- Step photos, tablet layout, watch: not on iOS either.

## Copied 1:1 (logic with Swift tests)

Each lands in `src/lib/cooking/` as pure TypeScript with the Swift cases
as Vitest cases (`CookingTests.swift`):

- Session row parsing: snake_case, null servings, unknown status
  tolerated, rows survive an erased creator (`started_by` null).
- Participant and check row parsing.
- Step advance: next step, stays put on the last.
- Ingredient toggle round trip.
- Servings → scale factor and clamp.
- Timer start, add time (clamped), reset from duration, stop,
  `soonestRunningTimer` (earliest, excludes fired), `remainingSeconds`,
  `hasFired`.
- Recipe cooking status: mine, joinable, none, mine wins.
- Step tokenizer: words and timer chips preserving spacing, no matches →
  words only, several timers each tokenised. Plus the annotation template
  tokenizer (`{n}` placeholders → chips, dangling ingredient id → plain
  words) and `StepDurationScanner` (DE/EN units, ranges "4–5 min", unicode
  and ASCII fractions, decimals with comma, ignores °C / g / cm, matches
  the trailing period in "5 min.").

## Adapted, not copied

- **Snap feed**: CSS scroll snap and an IntersectionObserver instead of
  `scrollPosition` / `viewAligned`. Three iOS pains (a flick moving several
  steps, edge bounce, an idle re-centre racing the native snap) are the
  browser's to solve; `scroll-snap-stop: always` is the first thing to
  try. Test on a real Android phone, the emulator's scroll physics differ.
- **Sheets and popovers**: vaul `Drawer`, shadcn `Popover`.
- **Pill**: a component in `Layout` above `BottomNav`; no pre-decoded
  thumbnail needed (nothing rebuilds it on tab switch).
- **Fullscreen**: a route without `Layout` chrome, status bar styled
  for the ambient colour.
- **Ambient colour**: canvas average needs `crossOrigin = "anonymous"`
  on the cover; a tainted canvas falls back to the brand wash.
- **Alarms**: `LocalNotifications` instead of `UNUserNotificationCenter`;
  the same reconcile / cancelPending / cancel split.
- **Deep link** `com.kblanks.plateful://cooking/<recipeId>` is not needed;
  pill and notification tap navigate in-app.

## Data shape

```ts
type CookingSession = { id: string; householdId: string; recipeId: string;
  startedBy: string | null; targetServings: number | null;
  status: "active" | "finished" | "abandoned"; startedAt: Date; endedAt: Date | null };
type CookingParticipant = { sessionId: string; userId: string; currentStepId: string | null };
type CookingTimer = { id: string; sessionId: string; stepId: string | null; label: string;
  endsAt: Date | null; durationSeconds: number | null; createdBy: string | null };
type CookingCheck = { ingredientId: string };
type RecipeCookingStatus =
  | { kind: "none" }
  | { kind: "mine"; sessionId: string }
  | { kind: "joinable"; sessionId: string; cookIds: string[] };
type StepToken =
  | { kind: "word"; text: string; spaceBefore: boolean }
  | { kind: "ingredientWord"; text: string; spaceBefore: boolean; mentionIndex: number;
      ingredientId: string; emoji: string | null }
  | { kind: "timer"; text: string; spaceBefore: boolean; seconds: number;
      secondsMax: number | null; label: string };
```

Rows are parsed once at the boundary (`Database["public"]["Tables"][…]["Row"]`
→ the types above; an unknown `status` reads as `abandoned` like iOS, never
as live). Query
cache: `queryKeys.cooking.household(householdId)` (active sessions with
participants and cover; feeds Cook button, pill and invite card) and
`queryKeys.cooking.session(sessionId)` (participants, checks, timers).
Mutations are optimistic and roll back on failure. The 1 s clock is a
hook that re-renders timer views, not cache state. Chip state is derived
from the timers by start label, never stored.

## Build sequence

1. Plan doc (this file). Commit.
2. `src/lib/cooking/` pure logic with the Swift cases as Vitest cases
   (scanner, tokenizers, timer math, session status, advance, scale).
   Commit.
3. API (`src/api/cooking.api.ts`), hooks (`src/hooks/cooking/`), query
   keys, realtime subscriptions, analytics events, E2E mocks for the four
   tables in `e2e/fixtures/api-mocks.fixture.ts`.
4. Route and cooking screen on fixtures (Storybook stories for feed, step,
   pill, invite card), then on the hooks: feed, header, bottom bar,
   ingredients sheet, Cook button states, pill, invite card, re-annotate
   on save. Verify on `npm run dev` with Kerim's household next to iOS:
   the same session on both, join from the other phone, checks and
   servings sync both ways, leave on one keeps the other's screen.
5. Timers: chips, rows, timers sheet, in-app ring, alarms and manifest
   permissions. Verify on a real Android phone: alarm rings with the screen
   off after 10 minutes and more (Doze), survives a reboot (the plugin's
   boot receiver restores pending alarms), stop on iOS silences Android
   and the other way round.
6. Strings DE/EN (wording from the iOS string catalog, 116 cooking and
   timer keys; "Kochen", "Mitkochen", "Weiter", "Fertig", "Zutaten",
   "Timer", "%@ kocht gerade", "Timer abgelaufen"), `versionName` 1.5,
   `versionCode` 44, Settings "About" `v1.5`, release commit. The Play
   upload is Kerim's.

## Open checks before stage 5

- Exact alarms: Android 14+ needs no prompt with `USE_EXACT_ALARM`;
  Android 12 and 13 need the user's setting. Which Android do Kerim's and
  Celine's phones run?
- The cover's canvas read across origins: covers are public Supabase
  Storage URLs, which should allow `crossOrigin = "anonymous"`; confirm
  on the device.

Already confirmed: the plugin's own manifest requests
`POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` and ships a boot
receiver that restores pending alarms; only the exact-alarm permissions
are missing from the app manifest.
