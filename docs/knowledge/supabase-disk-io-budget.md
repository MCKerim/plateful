# Supabase "Disk IO budget" warning: the database was not the cause

_Warning on 2026-10-04 (≈ 21:00 UTC) while the project still ran on Nano compute; resized to Micro on 2026-10-05. The memory/swap explanation is an inference, not a measurement._

**What happened.** Supabase warned "Project Plateful is using its Disk IO budget and may become unresponsive if fully consumed". The organization had been on Pro since 2026-09-10, but the project's compute was still **Nano** (shared CPU, up to 0.5 GB RAM) — the plan change does not move the compute. Kerim resized to **Micro** (1 GB RAM) in the dashboard on 2026-10-05 ≈ 14:15 UTC; he saw it offered at no extra cost.

**What Postgres itself wrote and read (production, 2026-10-05, counters since 2026-05-07):**

- Database 217 MB against 224 MB `shared_buffers`; cache hit rate 100.00 %; 73,980 blocks (≈ 580 MB) read from disk in 151 days.
- WAL 9.5 GB in 151 days (≈ 63 MB a day); checkpoints wrote 2.29 M buffers (≈ 17.9 GB) in the same time. A normal 5-minute checkpoint writes ≈ 90 buffers.
- The only burst near the warning: 34 `enrich-recipe` jobs completed 20:48–20:50 UTC on 10-04, and the checkpoint that followed (20:53:38) wrote 2,151 buffers (≈ 17 MB) over 218 s.

None of that is enough to drain a burst budget, so the load came from outside Postgres' own data files. Supabase's troubleshooting guide names swapping under memory pressure as the first common cause, and Nano ran a 224 MB buffer pool plus PostgREST, Auth and a pg-boss worker that polls ≈ 3 times a second around the clock inside 0.5 GB. **Not verified:** the memory, swap and IO-budget charts live in the dashboard (Observability → Database), which the session could not open.

**The 469 GB of temp files were one small file a minute, not a runaway query.** `pg_stat_database.temp_bytes` stood at 469 GB in 181,574 temp files since 2026-05-07, while `pg_stat_statements` attributed ≈ 200 MB to any statement. That is ≈ 1,200 files a day (one every 72 s) of 2.8 MB on average, ≈ 3.3 GB a day or 38 kB/s — far too little to drain an IO budget. Mechanism, verified on 10-05: `pg_stat_statements()` hands its rows over in a tuplestore, so any read of the view spills to one temp file as soon as its content is larger than `work_mem` (reproduced with `set local work_mem = '64kB'`: 195 entries, 99 kB of query text → one 166 kB temp file, the first since the restart). On Nano `work_mem` was 2,184 kB and the view held up to 5,000 entries (3–4 MB per read, matching the 3.2–3.7 MB per file sampled before the restart). The reader is very likely Supabase's own `postgres_exporter`, which scrapes about once a minute: its session is connected, yet none of its queries appear in `pg_stat_statements`, so its temp usage shows up only in the database-wide counter. **Inferred, not observed:** that the exporter reads the view on every scrape. After the restart the view is nearly empty and `work_mem` is 3,500 kB, so the counter stays at 0 until the view has grown past that again (≈ 4,000 entries); if files reappear at one a minute then, this is why, and it is harmless. `log_temp_files` is `-1`, so the logs never show temp files.

**The resize.** Database down ≈ 14:15–14:19 UTC (about four minutes; Supabase says "usually less than 2"). After it: `shared_buffers` 256 MB, `effective_cache_size` 768 MB, `work_mem` 3,500 kB (was 2,184), `maintenance_work_mem` 64 MB (was 32), `max_connections` still 60. PostgREST, the extractor's pg-boss worker (through Supavisor, no container restart), both Realtime slots and pg_cron reconnected by themselves; the per-minute sweeps have a gap 14:15–14:18. All cumulative statistics (`pg_stat_database`, `pg_stat_statements`, table counters) start again at that restart.

**What takes the space in 217 MB** (not an IO problem, just worth knowing): `pgboss.job_common` 88 MB, 56 MB of it the stack traces of the enrichment loop (recipe-extractor `docs/knowledge/enrichment-failure-cooldown.md`; they expire 7 days after the fix is deployed); `net._http_response` 51 MB for 260 live rows (bloat from pg_net's 6-hour TTL deletes); `cron.job_run_details` 28 MB, 64,388 rows since 2026-07-23, never pruned (≈ 900 new rows a day from seven jobs).

**How to look next time.** Start with the dashboard charts for memory, swap and the IO budget. Then, to rule the database in or out:

```sql
select pg_size_pretty(pg_database_size(current_database())) as db,
       round(100.0 * blks_hit / nullif(blks_hit + blks_read, 0), 2) as cache_hit_pct,
       blks_read, temp_files, pg_size_pretty(temp_bytes) as temp
from pg_stat_database where datname = current_database();

select calls, temp_blks_written, shared_blks_read, shared_blks_written,
       pg_size_pretty(wal_bytes) as wal, left(query, 120)
from extensions.pg_stat_statements
order by temp_blks_written + shared_blks_read + shared_blks_written desc limit 15;
```

`log_checkpoints` is on, so `postgres_logs` shows every checkpoint's buffer count and write time — a burst stands out against the ≈ 90-buffer baseline.

Source: Supabase MCP (`execute_sql`, `query_logs`, `get_project`) against production and Kerim's message in chat, 2026-10-05; Supabase docs "High Disk I/O" and "Compute and Disk".
