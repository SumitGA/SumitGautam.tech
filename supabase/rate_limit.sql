-- ============================================================================
-- Generic per-IP rate limiting, shared by any public endpoint.
--
-- Run in the Supabase SQL Editor. Idempotent — safe to re-run.
--
-- This generalises the earlier chat_rate_limit table. Rather than a table and
-- a function per endpoint, one table is keyed by (bucket, ip) so a new
-- endpoint needs no migration — it just passes a new bucket name.
--
-- chat_rate_limit is deliberately left in place so /api/chat keeps working
-- while it is still pointed at the old function.
-- ============================================================================

create table if not exists rate_limit (
  bucket       text        not null,
  ip           text        not null,
  count        int         not null default 0,
  window_start timestamptz not null default now(),
  primary key (bucket, ip)
);

-- Service role only. No policies, so nothing else can read or write it.
alter table rate_limit enable row level security;

create index if not exists rate_limit_window_idx on rate_limit (window_start);

-- Atomic check-and-increment; returns TRUE when the request is allowed.
-- SECURITY DEFINER so it runs with the owner's rights whatever the caller is.
--
-- The lock matters: without FOR UPDATE, two concurrent requests both read the
-- same count and both write count+1, so the limit can be exceeded under
-- exactly the burst it exists to stop.
create or replace function check_rate_limit(
  p_bucket         text,
  p_ip             text,
  p_limit          int,
  p_window_seconds int
) returns boolean as $$
declare
  v_count        int;
  v_window_start timestamptz;
begin
  select count, window_start
    into v_count, v_window_start
    from rate_limit
   where bucket = p_bucket and ip = p_ip
     for update;

  if not found then
    insert into rate_limit (bucket, ip, count, window_start)
    values (p_bucket, p_ip, 1, now())
    on conflict (bucket, ip) do update set count = rate_limit.count + 1;
    return true;
  end if;

  if v_window_start < now() - make_interval(secs => p_window_seconds) then
    update rate_limit
       set count = 1, window_start = now()
     where bucket = p_bucket and ip = p_ip;
    return true;
  end if;

  if v_count >= p_limit then
    return false;
  end if;

  update rate_limit set count = count + 1
   where bucket = p_bucket and ip = p_ip;
  return true;
end;
$$ language plpgsql security definer;

create or replace function prune_rate_limit() returns void as $$
  delete from rate_limit where window_start < now() - interval '1 day';
$$ language sql security definer;

-- Callable only by the service role, which bypasses these grants anyway.
revoke execute on function check_rate_limit(text, text, int, int) from public;
revoke execute on function prune_rate_limit() from public;
