# Missions & Rewards System

A household-scoped gamification system that guides users through key app actions (missions) and rewards completion with badges.

---

## Architecture Overview

```
mission_definitions (DB) — source of truth for all missions
       ↓
household_missions (DB) — per-household progress, auto-completed by RPC
       ↓
household_rewards (DB) — badges earned by completing a full mission set
```

**Key design decisions:**
- Missions are defined in the DB (`mission_definitions`), not in code — adding a new mission requires only a SQL insert, no frontend changes.
- Progress is capped at `required_count` by the `increment_household_mission` RPC — callers don't need to worry about over-incrementing.
- `useIncrementMission` guards against redundant RPC calls by checking the React Query cache before firing — safe to call on every user action (e.g. every chatbot message).
- The card hides itself permanently once the reward is claimed and the dialog is closed.

---

## Database Tables

| Table | Purpose |
|---|---|
| `mission_definitions` | Static definitions: id, mission_set, scope, required_count |
| `household_missions` | Progress per household: progress int, completed_at |
| `household_rewards` | Claimed badges per household: mission_set, badge_id, claimed_by |
| `user_missions` | (Structure only, not used in UI yet) |
| `user_rewards` | (Structure only, not used in UI yet) |

All tables have RLS. Household tables gate access via `users.household_id = auth.uid()`.

---

## Key Files

| File | Role |
|---|---|
| `supabase/migrations/20260322000000_create_missions_and_rewards.sql` | All tables, RLS policies, RPC, seed data |
| `src/types/missions.types.ts` | `HouseholdMission`, `HouseholdReward` domain types |
| `src/api/missions.api.ts` | Supabase queries: get missions, increment, claim reward, get rewards |
| `src/hooks/missions/useHouseholdMissions.ts` | React Query hook — fetches all missions for the household |
| `src/hooks/missions/useHouseholdRewards.ts` | React Query hook — fetches earned badges |
| `src/hooks/missions/useIncrementMission.ts` | Mutation — increments mission progress (cache-guarded, supports `count`) |
| `src/hooks/missions/useClaimReward.ts` | Mutation — inserts into household_rewards |
| `src/hooks/analytics/useMissionsTracking.ts` | PostHog events for mission interactions |
| `src/components/home/GettingStartedCard.tsx` | Collapsible card on home screen with progress bar + reward dialog |
| `src/lib/query-keys.ts` | Cache keys: `queryKeys.missions.householdMissions(id)`, `queryKeys.missions.householdRewards(id)` |

---

## How to Add a New Mission

### 1. Insert into `mission_definitions`

```sql
INSERT INTO mission_definitions (id, mission_set, scope, required_count)
VALUES ('rate_a_recipe', 'onboarding', 'household', 1);
```

- `id` — snake_case string, used everywhere as the mission identifier
- `mission_set` — groups missions together (e.g. `'onboarding'`). All missions in a set must be completed before the reward can be claimed.
- `scope` — `'household'` or `'user'` (user-scoped not wired up in UI yet)
- `required_count` — how many times the action must happen before the mission completes

Apply via a new Supabase migration.

### 2. Add i18n labels

In both `src/locales/translation.en.json` and `translation.de.json`:

```json
"home": {
  "gettingStarted": {
    "missions": {
      "rate_a_recipe": "Rate your first recipe"
    }
  }
}
```

The key must match the mission `id` exactly.

### 3. Add a route (optional)

In `GettingStartedCard.tsx`, add an entry to `MISSION_ROUTES` so tapping the mission navigates to the right page:

```ts
const MISSION_ROUTES: Record<string, string> = {
  rate_a_recipe: "/recipe/123", // or a general route
};
```

If omitted, tapping falls back to `"/home"`.

### 4. Fire the increment where the action happens

```ts
const incrementMission = useIncrementMission();

// somewhere in your component/hook when the action succeeds:
incrementMission.mutate({ missionId: "rate_a_recipe" });

// or for multi-count actions:
incrementMission.mutate({ missionId: "import_recipes", count: 3 });
```

`useIncrementMission` is safe to call unconditionally — it skips the RPC if the mission is already completed (cache check) and the DB RPC caps progress at `required_count`.

---

## How to Add a New Mission Set (e.g. "power_user")

1. Insert missions with `mission_set = 'power_user'` into `mission_definitions`
2. Create a new card component (similar to `GettingStartedCard`) with its own `MISSION_SET` and `BADGE_ID` constants
3. Add the badge i18n key: `badges.your_badge_id`
4. Add the badge to the Achievements section in `HouseholdSettings.tsx`

The reward claiming flow (`useClaimReward`) and the rewards display are already generic — they work with any `missionSet` string.

---

## Reward Flow

```
All missions in set completed
  → "Claim Reward" button appears in GettingStartedCard
  → useClaimReward inserts into household_rewards
  → Reward dialog opens with starburst + badge pop animation + flying stars
  → User can navigate to Household Settings to see earned badges
  → Card hides permanently (alreadyClaimed = true, dialog closed)
```

The animation uses:
- CSS `@keyframes starburst-spin-in` + `@keyframes badge-pop` (in `src/index.css`)
- `motion/react` (`AnimatePresence` + `motion.span`) for flying ★/✦ star particles rendered via React portal into `document.body`

---

## Analytics Events (PostHog)

| Event | When |
|---|---|
| `mission_tapped` | User taps a mission row (navigates to action) |
| `mission_card_collapsed` | User collapses the Getting Started card |
| `mission_card_expanded` | User expands the Getting Started card |
| `mission_completed` | (hook available, not currently called) |
| `reward_claimed` | User taps "Claim Reward" |
