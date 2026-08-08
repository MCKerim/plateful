-- Retire the household-keyed subscription logic.
--
-- With entitlements stored per user and premium derived from membership, three
-- things stop having a job:
--
--   * The account-deletion RPC no longer has to detach a payer by hand. The
--     `user_subscriptions` FK cascades, and the household stops being covered
--     the moment the user row goes.
--   * `expire_orphaned_household_subscriptions` existed only because a payer
--     who deleted their account left behind a row no future store event could
--     ever correct. Nothing is left behind now, and the expiry is checked
--     inline by `household_entitlements`, so there is nothing to reconcile on
--     a schedule.
--   * The deletion preflight reported `subscription_expires_at`, which the app
--     never displayed and which no longer means anything: access ends with the
--     account, not at the end of the paid period.
--
-- It gains one thing instead: `household_has_other_members`, so the app can
-- warn a payer that deleting takes premium away from people who are staying.

-- 1. Account deletion no longer touches subscription state.
create or replace function public.request_account_deletion(
  p_request_id uuid,
  p_successor_user_id uuid default null::uuid
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.users%rowtype;
  v_household public.household%rowtype;
  v_existing_job private.account_deletion_jobs%rowtype;
  v_other_member_count integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_request_id is null then
    return jsonb_build_object(
      'accepted', false,
      'code', 'invalid_request_id'
    );
  end if;

  select *
    into v_existing_job
    from private.account_deletion_jobs j
   where j.request_id = p_request_id;

  if found then
    if v_existing_job.user_id = v_user_id then
      return jsonb_build_object(
        'accepted', true,
        'request_id', v_existing_job.request_id,
        'status', v_existing_job.status,
        'retry_after_seconds', 2
      );
    end if;
    return jsonb_build_object(
      'accepted', false,
      'code', 'request_id_conflict'
    );
  end if;

  select *
    into v_existing_job
    from private.account_deletion_jobs j
   where j.user_id = v_user_id
     and j.status <> 'completed'
   order by j.requested_at
   limit 1
   for update;

  if found then
    return jsonb_build_object(
      'accepted', true,
      'request_id', v_existing_job.request_id,
      'status', v_existing_job.status,
      'retry_after_seconds', 2
    );
  end if;

  select *
    into v_profile
    from public.users u
   where u.id = v_user_id
   for update;

  if not found then
    return jsonb_build_object(
      'accepted', false,
      'code', 'profile_not_found'
    );
  end if;

  if v_profile.deletion_requested_at is not null then
    return jsonb_build_object(
      'accepted', false,
      'code', 'deletion_state_inconsistent'
    );
  end if;

  if v_profile.household_id is not null then
    select *
      into v_household
      from public.household h
     where h.id = v_profile.household_id
     for update;

    perform member.id
      from public.users member
     where member.household_id = v_profile.household_id
     order by member.id
     for update;

    if found and v_household.owner_id = v_user_id then
      select count(*)
        into v_other_member_count
        from public.users member
       where member.household_id = v_profile.household_id
         and member.id <> v_user_id
         and member.deletion_requested_at is null;

      if v_other_member_count > 0 then
        if p_successor_user_id is null then
          return jsonb_build_object(
            'accepted', false,
            'code', 'owner_successor_required'
          );
        end if;
        if not exists (
          select 1
            from public.users successor
           where successor.id = p_successor_user_id
             and successor.id <> v_user_id
             and successor.household_id = v_profile.household_id
             and successor.deletion_requested_at is null
        ) then
          return jsonb_build_object(
            'accepted', false,
            'code', 'invalid_owner_successor'
          );
        end if;

        update public.household
           set owner_id = p_successor_user_id
         where id = v_profile.household_id;
      elsif p_successor_user_id is not null then
        return jsonb_build_object(
          'accepted', false,
          'code', 'owner_successor_not_required'
        );
      end if;
    elsif p_successor_user_id is not null then
      return jsonb_build_object(
        'accepted', false,
        'code', 'owner_successor_not_required'
      );
    end if;
  elsif p_successor_user_id is not null then
    return jsonb_build_object(
      'accepted', false,
      'code', 'owner_successor_not_required'
    );
  end if;

  insert into private.account_deletion_jobs (
    request_id,
    user_id,
    subject_user_id
  )
  values (
    p_request_id,
    v_user_id,
    v_user_id
  );

  -- Detach provider-independent personal attribution first. These writes and
  -- household ownership changes share this one transaction.
  delete from public.recipe_ratings where owner_id = v_user_id;
  delete from public.cooking_session_participants where user_id = v_user_id;
  delete from public.push_tokens where user_id = v_user_id;
  delete from public.survey_answers where user_id = v_user_id;
  delete from public.user_missions where user_id = v_user_id;
  delete from public.user_rewards where user_id = v_user_id;

  update public.cooking_sessions
     set started_by = null
   where started_by = v_user_id;
  update public.cooking_session_checks
     set checked_by = null
   where checked_by = v_user_id;
  update public.cooking_session_timers
     set created_by = null
   where created_by = v_user_id;
  update public.household_rewards
     set claimed_by = null
   where claimed_by = v_user_id;
  update public.invites
     set invited_by = null
   where invited_by = v_user_id;
  update public.invites
     set used_by = null
   where used_by = v_user_id;
  update public.shared_recipes
     set created_by = null
   where created_by = v_user_id;
  update public.recipe_imports
     set created_by = null
   where created_by = v_user_id;
  update public.collections
     set created_by = null
   where created_by = v_user_id;
  update public.cookbooks
     set owner_id = null
   where owner_id = v_user_id;
  update public.meal_planning
     set owner_id = null
   where owner_id = v_user_id;
  update public.recipes
     set owner_id = null
   where owner_id = v_user_id;

  -- The entitlement is this user's own row and cascades with the profile, so
  -- there is nothing to detach: the household simply stops being covered.

  -- Supabase Auth refuses deletion while Storage objects retain this owner.
  -- The objects are household/shared/import assets and remain governed by their
  -- path-based policies and retention jobs; only personal ownership is detached.
  update storage.objects
     set owner = null,
         owner_id = null,
         updated_at = now()
   where owner = v_user_id
      or owner_id = v_user_id::text;

  if v_profile.household_id is not null
     and v_household.owner_id = v_user_id
     and v_other_member_count = 0 then
    delete from public.household
     where id = v_profile.household_id;
  end if;

  update public.users
     set household_id = null,
         email = '',
         username = '',
         language = null,
         notification_preferences = null,
         has_completed_survey = false,
         deletion_requested_at = now()
   where id = v_user_id;

  return jsonb_build_object(
    'accepted', true,
    'request_id', p_request_id,
    'status', 'pending',
    'retry_after_seconds', 2
  );
end;
$function$;

-- 2. The deletion preflight reports the entitlement from the new model, and
--    whether anyone is left to lose it.
create or replace function public.get_account_deletion_context()
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.users%rowtype;
  v_household public.household%rowtype;
  v_job private.account_deletion_jobs%rowtype;
  v_successors jsonb := '[]'::jsonb;
  v_is_entitled boolean := false;
  v_other_member_count integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select *
    into v_job
    from private.account_deletion_jobs j
   where j.user_id = v_user_id
     and j.status <> 'completed'
   order by j.requested_at
   limit 1;

  if found then
    return jsonb_build_object(
      'request_id', v_job.request_id,
      'status', v_job.status,
      'retry_after_seconds',
        greatest(1, ceil(extract(epoch from (v_job.next_attempt_at - now())))::integer)
    );
  end if;

  select *
    into v_profile
    from public.users u
   where u.id = v_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Profile not found';
  end if;

  if v_profile.household_id is not null then
    select *
      into v_household
      from public.household h
     where h.id = v_profile.household_id;

    if found and v_household.owner_id = v_user_id then
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', member.id, 'username', member.username)
          order by member.created_at, member.id
        ),
        '[]'::jsonb
      )
        into v_successors
        from public.users member
       where member.household_id = v_profile.household_id
         and member.id <> v_user_id
         and member.deletion_requested_at is null;
    end if;

    -- Not only the owner needs this: any entitled member leaving takes premium
    -- with them, so the warning has to be driven by membership, not ownership.
    select count(*)
      into v_other_member_count
      from public.users member
     where member.household_id = v_profile.household_id
       and member.id <> v_user_id
       and member.deletion_requested_at is null;
  end if;

  select exists (
    select 1
      from public.user_subscriptions s
     where s.user_id = v_user_id
       and s.is_active
       and (s.expires_at is null or s.expires_at > now())
  )
  into v_is_entitled;

  return jsonb_build_object(
    'request_id', null,
    'status', null,
    'household_name', v_household.name,
    'is_owner', coalesce(v_household.owner_id = v_user_id, false),
    'requires_successor',
      coalesce(v_household.owner_id = v_user_id, false)
      and jsonb_array_length(v_successors) > 0,
    'eligible_successors', v_successors,
    'deletes_household',
      coalesce(v_household.owner_id = v_user_id, false)
      and jsonb_array_length(v_successors) = 0,
    'is_subscription_payer', v_is_entitled,
    'household_has_other_members', v_other_member_count > 0
  );
end;
$function$;

-- 3. The orphaned-subscription reaper has nothing left to reap.
select cron.unschedule('expire-orphaned-household-subscriptions');
drop function if exists private.expire_orphaned_household_subscriptions();
