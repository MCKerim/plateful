-- Warn about a double charge before it happens.
--
-- Premium follows the person, so two people who each subscribed while living
-- alone stay subscribed twice once they move in together. Nothing can prevent
-- that (the store owns the purchase) and neither of them can see the other's
-- billing, so the honest fix is to say it at the one moment it is still cheap
-- to act on: before joining.
--
-- The joiner cannot read the target household's entitlements themselves, since
-- RLS deliberately scopes `household_entitlements` to the household you are
-- already in. This preview RPC is security definer and already the one place
-- that discloses a household to a non-member, so the flag belongs here.

create or replace function public.preview_household_invite(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_started_at timestamptz;
  v_attempt_count bigint;
  v_retry_after_seconds integer;
  v_token_fingerprint text;
  v_household_id uuid;
  v_household_name text;
  v_expires_at timestamptz;
  v_has_active_subscription boolean;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required';
  end if;

  v_token_fingerprint := pg_catalog.encode(
    extensions.digest(coalesce(p_token, ''), 'sha256'),
    'hex'
  );

  insert into private.household_invite_preview_limits as limits (
    user_id,
    window_started_at,
    attempt_count
  )
  values (
    v_user_id,
    v_now,
    1
  )
  on conflict (user_id) do update
  set
    window_started_at = case
      when limits.window_started_at <= v_now - interval '10 minutes'
        then v_now
      else limits.window_started_at
    end,
    attempt_count = case
      when limits.window_started_at <= v_now - interval '10 minutes'
        then 1
      else least(limits.attempt_count + 1, 1000000)
    end
  returning window_started_at, attempt_count
  into v_window_started_at, v_attempt_count;

  if v_attempt_count > 30 then
    v_retry_after_seconds := greatest(
      1,
      ceil(
        extract(
          epoch from (
            v_window_started_at + interval '10 minutes' - v_now
          )
        )
      )::integer
    );

    -- One event marks the beginning of a blocked window. Further blocked calls
    -- do not grow the audit table.
    if v_attempt_count = 31 then
      insert into private.household_invite_preview_events (
        user_id,
        token_fingerprint,
        outcome
      )
      values (
        v_user_id,
        v_token_fingerprint,
        'rate_limited'
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'status', 'rate_limited',
      'retry_after_seconds', v_retry_after_seconds
    );
  end if;

  select i.household_id, h.name, i.expires_at
  into v_household_id, v_household_name, v_expires_at
  from public.invites i
  join public.household h on h.id = i.household_id
  where i.token = p_token
    and i.expires_at > v_now;

  if not found then
    insert into private.household_invite_preview_events (
      user_id,
      token_fingerprint,
      outcome
    )
    values (
      v_user_id,
      v_token_fingerprint,
      'unavailable'
    );

    return pg_catalog.jsonb_build_object('status', 'unavailable');
  end if;

  insert into private.household_invite_preview_events (
    user_id,
    token_fingerprint,
    outcome
  )
  values (
    v_user_id,
    v_token_fingerprint,
    'ready'
  );

  -- Whether the household is already covered, so the joiner can be told before
  -- they end up paying alongside someone else. Only ever a boolean: who pays
  -- there, and until when, stays private to that household.
  select exists (
    select 1
      from public.users u
      join public.user_subscriptions s on s.user_id = u.id
     where u.household_id = v_household_id
       and s.is_active
       and (s.expires_at is null or s.expires_at > pg_catalog.now())
  )
  into v_has_active_subscription;

  return pg_catalog.jsonb_build_object(
    'status', 'ready',
    'household_id', v_household_id,
    'household_name', v_household_name,
    'expires_at', v_expires_at,
    'has_active_subscription', v_has_active_subscription
  );
end;
$function$;
