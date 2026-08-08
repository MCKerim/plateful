-- Entitlements belong to the user, not to the household.
--
-- "I hold an active store subscription" is a fact about a person: it follows
-- their Apple/Google account, not the household they happen to be in. Storing
-- it per household meant nothing recomputed the row when the payer left, so a
-- household they walked away from stayed premium forever while the household
-- they joined stayed paywalled until the next renewal event happened to fire.
--
-- Here the entitlement is keyed by user and the household's premium state is
-- derived (see household_entitlements). Leaving, joining, deleting a household
-- and deleting an account then need no subscription code of their own: the
-- membership change alone is the answer.

create table public.user_subscriptions (
  user_id       uuid primary key references public.users (id) on delete cascade,
  is_active     boolean     not null default false,
  expires_at    timestamptz,
  store         text,
  environment   text,
  last_event_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.user_subscriptions is
  'One store entitlement per user, written only by the revenuecat-webhook edge function. Comped access is a row with store = ''MANUAL'' and no expires_at.';

alter table public.user_subscriptions enable row level security;

-- Read your own row and your household's. Naming the payer in Settings and
-- warning when two members are being charged both need the household's rows.
-- There are deliberately no insert/update/delete policies: the webhook holds
-- the service role and is the only writer, exactly as before. A client-writable
-- row would let anyone self-grant premium.
create policy "Members read household entitlements"
  on public.user_subscriptions
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or user_id in (
      select u.id
        from public.users u
       where u.household_id = (select private.current_user_household_id())
    )
  );

-- Every question the app asks about premium, answered by counting rows:
--   0 rows  -> paywalled
--   1 row   -> premium, and that member is the payer
--   2+ rows -> premium, and two members are being charged for one household
--
-- security_invoker so the caller's RLS applies and this can only ever return
-- the caller's own household.
create view public.household_entitlements
with (security_invoker = on) as
select
  u.household_id,
  u.id       as user_id,
  u.username,
  s.expires_at,
  s.store,
  s.environment
  from public.users u
  join public.user_subscriptions s on s.user_id = u.id
 where u.household_id is not null
   and s.is_active
   and (s.expires_at is null or s.expires_at > now());

grant select on public.household_entitlements to authenticated;

-- Carry the existing rows over, comps included. distinct on is defensive: a
-- payer who had already drifted between households could otherwise appear
-- twice. Prefer their live row.
insert into public.user_subscriptions
  (user_id, is_active, expires_at, store, environment, last_event_at)
select distinct on (payer_user_id)
       payer_user_id,
       is_active,
       expires_at,
       store,
       environment,
       last_event_at
  from public.household_subscriptions
 where payer_user_id is not null
 order by payer_user_id, is_active desc, expires_at desc nulls last;
