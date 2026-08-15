-- Health signal for the recipe image cleanup queue.
--
-- Why this exists: `cron.job_run_details` reports "succeeded" for the
-- maintenance job on every run, because the job body is `net.http_post`, which
-- is asynchronous — it queues the request and returns a request id. pg_cron
-- records that the *enqueue* returned one row, never the HTTP outcome. Over one
-- recent 7-day window the cron history was 100% green while the edge function
-- actually returned 3x 502 and one timeout.
--
-- The real HTTP results land in `net._http_response`, but that table is
-- retained for only a few hours, so it cannot back an alert that runs less
-- often than that. The durable signal is the queue itself: a job that keeps
-- failing climbs `attempt_count` and eventually lands on 'dead', and both
-- states persist until someone deals with them.
--
-- Lives in `public` rather than `private` because PostgREST only exposes
-- `public`, and the maintenance edge function calls this over RPC. Grants match
-- its siblings (`claim_recipe_image_cleanup_jobs`,
-- `complete_recipe_image_cleanup_job`): service_role only, never anon or
-- authenticated.

create or replace function public.recipe_image_cleanup_health()
returns table (
  dead_jobs bigint,
  stuck_jobs bigint,
  pending_jobs bigint,
  oldest_pending_age interval,
  last_completion timestamptz
)
language sql
security definer
set search_path to ''
as $function$
  select
    count(*) filter (where j.status = 'dead') as dead_jobs,
    -- Retried at least three times and still not done: failing repeatedly
    -- rather than merely waiting its turn.
    count(*) filter (where j.status <> 'completed' and j.attempt_count >= 3) as stuck_jobs,
    count(*) filter (where j.status = 'pending') as pending_jobs,
    now() - min(j.created_at) filter (where j.status = 'pending') as oldest_pending_age,
    max(j.completed_at) as last_completion
  from private.recipe_image_cleanup_jobs j;
$function$;

comment on function public.recipe_image_cleanup_health() is
  'Queue health for recipe image cleanup. Non-zero dead_jobs or stuck_jobs means '
  'cleanup is failing - the cron''s own history cannot show this because '
  'net.http_post is fire-and-forget and always reports success.';

revoke all on function public.recipe_image_cleanup_health() from public;
revoke all on function public.recipe_image_cleanup_health() from anon, authenticated;
grant execute on function public.recipe_image_cleanup_health() to service_role;
