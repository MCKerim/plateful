-- Drop the household-keyed subscription table.
--
-- Nothing in the database has referenced it since
-- 20260807140000_retire_household_subscriptions_logic: the webhook writes
-- `user_subscriptions`, the reaper cron is gone, and both account-deletion
-- RPCs read the new model. Every row was carried over to `user_subscriptions`
-- by 20260807120000_user_subscriptions, comps included.
--
-- Premium now lives in exactly one place (an entitlement per user) and the
-- household's state is derived from membership by `household_entitlements`.

drop table if exists public.household_subscriptions;
