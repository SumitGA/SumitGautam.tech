-- ============================================================================
-- Analytics: first-party event collection and KPI aggregation
--
-- Run in the Supabase SQL Editor. Idempotent — safe to re-run.
--
-- Design notes
--  * No IP address and no user agent string are ever stored. The API route
--    derives country/device/browser from request headers and discards the rest.
--  * visitor_id is a random UUID minted in the browser (localStorage), and
--    session_id a random UUID per tab session. Neither is derived from anything
--    identifying, and neither is a cookie, so no consent banner is required.
--  * Referrers are stored as host only, not full URL — lower cardinality and
--    avoids capturing query strings from other people's sites.
--  * Writes go through /api/analytics using the service role. The anon key
--    cannot insert, so the endpoint stays the only ingest path and can filter
--    bots and rate limit.
-- ============================================================================

create table if not exists analytics_events (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  visitor_id    text        not null,
  session_id    text        not null,
  event         text        not null,
  path          text,
  referrer_host text,
  country       text,
  device        text,
  browser       text,
  meta          jsonb       not null default '{}'::jsonb
);

create index if not exists analytics_events_created_at_idx on analytics_events (created_at desc);
create index if not exists analytics_events_event_idx      on analytics_events (event, created_at desc);
create index if not exists analytics_events_visitor_idx    on analytics_events (visitor_id, created_at);
create index if not exists analytics_events_session_idx    on analytics_events (session_id);

alter table analytics_events enable row level security;

-- Read: signed-in admin only. Deliberately no public SELECT — unlike the
-- content tables, this is not site content.
drop policy if exists "analytics readable by authenticated" on analytics_events;
create policy "analytics readable by authenticated"
  on analytics_events for select
  to authenticated
  using (true);

-- No INSERT policy at all: ingest uses the service role, which bypasses RLS.
-- Without this the anon key could forge events straight into the table.

-- ============================================================================
-- Aggregation
--
-- These run as the caller (the signed-in admin), so the RLS policy above still
-- applies. They exist so the dashboard fetches a few dozen aggregate rows
-- instead of the whole event table.
-- ============================================================================

-- Headline counters for the period, plus the same window immediately before it
-- so the dashboard can show direction of travel.
drop function if exists analytics_overview(int);
create function analytics_overview(p_days int default 30)
returns table (
  visitors            bigint,
  sessions            bigint,
  pageviews           bigint,
  new_visitors        bigint,
  returning_visitors  bigint,
  bounce_rate         numeric,
  pages_per_session   numeric,
  prev_visitors       bigint,
  prev_pageviews      bigint
)
language sql
stable
as $$
  with period as (
    select now() - make_interval(days => p_days) as start_at,
           now() - make_interval(days => p_days * 2) as prev_start_at
  ),
  cur as (
    select * from analytics_events, period where created_at >= period.start_at
  ),
  prev as (
    select * from analytics_events, period
    where created_at >= period.prev_start_at and created_at < period.start_at
  ),
  -- First time each visitor in the current window was ever seen, so "new"
  -- means genuinely new rather than new-to-this-window.
  first_seen as (
    select visitor_id, min(created_at) as first_at
    from analytics_events
    where visitor_id in (select visitor_id from cur)
    group by visitor_id
  ),
  -- A bounce is a session with a single pageview.
  session_depth as (
    select session_id, count(*) filter (where event = 'pageview') as views
    from cur group by session_id
  )
  select
    (select count(distinct visitor_id) from cur),
    (select count(distinct session_id) from cur),
    (select count(*) from cur where event = 'pageview'),
    (select count(*) from first_seen, period where first_at >= period.start_at),
    (select count(*) from first_seen, period where first_at <  period.start_at),
    (select case when count(*) = 0 then 0
       else round(100.0 * count(*) filter (where views <= 1) / count(*), 1) end
     from session_depth where views > 0),
    (select case when count(*) = 0 then 0
       else round(avg(views), 2) end
     from session_depth where views > 0),
    (select count(distinct visitor_id) from prev),
    (select count(*) from prev where event = 'pageview');
$$;

-- Daily series, gap-filled so the chart has no missing days.
drop function if exists analytics_timeseries(int);
create function analytics_timeseries(p_days int default 30)
returns table (day date, visitors bigint, sessions bigint, pageviews bigint)
language sql
stable
as $$
  with days as (
    select generate_series(
      (now() - make_interval(days => p_days))::date, now()::date, '1 day'
    )::date as day
  )
  select d.day,
         count(distinct e.visitor_id),
         count(distinct e.session_id),
         count(e.*) filter (where e.event = 'pageview')
  from days d
  left join analytics_events e on e.created_at::date = d.day
  group by d.day
  order by d.day;
$$;

-- One function for every "top N by column" panel, rather than five near
-- identical ones. p_dimension is validated against a fixed list, so this
-- cannot be used to read arbitrary columns.
drop function if exists analytics_breakdown(text, int, int);
create function analytics_breakdown(p_dimension text, p_days int default 30, p_limit int default 10)
returns table (label text, visitors bigint, pageviews bigint)
language plpgsql
stable
as $$
begin
  if p_dimension not in ('path', 'referrer_host', 'country', 'device', 'browser') then
    raise exception 'unsupported dimension: %', p_dimension;
  end if;

  return query execute format($f$
    select coalesce(nullif(%I, ''), $3)::text,
           count(distinct visitor_id),
           count(*) filter (where event = 'pageview')
    from analytics_events
    where created_at >= now() - make_interval(days => $1)
    group by 1
    order by 2 desc, 3 desc
    limit $2
  $f$, p_dimension)
  using p_days, p_limit,
        case when p_dimension = 'referrer_host' then '(direct)' else '(unknown)' end;
end;
$$;

-- Conversions, expressed as a rate against sessions in the same window.
drop function if exists analytics_conversions(int);
create function analytics_conversions(p_days int default 30)
returns table (event text, total bigint, visitors bigint, rate numeric)
language sql
stable
as $$
  with period as (select now() - make_interval(days => p_days) as start_at),
  sessions as (
    select count(distinct session_id) as n
    from analytics_events, period where created_at >= period.start_at
  )
  select e.event,
         count(*),
         count(distinct e.visitor_id),
         case when (select n from sessions) = 0 then 0
              else round(100.0 * count(distinct e.session_id) / (select n from sessions), 2) end
  from analytics_events e, period
  where e.created_at >= period.start_at
    and e.event <> 'pageview'
  group by e.event
  order by 2 desc;
$$;

-- Weekly cohort retention. Cohort is the week a visitor was first ever seen;
-- offset 0 is that same week, so it is always 100% by definition.
drop function if exists analytics_retention(int);
create function analytics_retention(p_weeks int default 6)
returns table (cohort_week date, week_offset int, cohort_size bigint, retained bigint)
language sql
stable
as $$
  with first_seen as (
    select visitor_id, date_trunc('week', min(created_at)) as cohort
    from analytics_events
    group by visitor_id
  ),
  in_range as (
    select * from first_seen
    where cohort >= date_trunc('week', now() - make_interval(weeks => p_weeks))
  ),
  activity as (
    select distinct f.visitor_id, f.cohort,
           (extract(epoch from date_trunc('week', e.created_at) - f.cohort) / 604800)::int as offset_weeks
    from in_range f
    join analytics_events e on e.visitor_id = f.visitor_id
  ),
  sizes as (select cohort, count(*) as n from in_range group by cohort)
  select s.cohort::date, a.offset_weeks, s.n, count(distinct a.visitor_id)
  from sizes s
  join activity a on a.cohort = s.cohort
  where a.offset_weeks >= 0
  group by s.cohort, a.offset_weeks, s.n
  order by s.cohort, a.offset_weeks;
$$;

-- Housekeeping. Analytics value decays fast on a portfolio; keep a year.
drop function if exists prune_analytics_events();
create function prune_analytics_events()
returns void
language sql
as $$
  delete from analytics_events where created_at < now() - interval '1 year';
$$;

-- Postgres grants EXECUTE to PUBLIC on every new function, so the grants below
-- do not narrow anything on their own — the anon key could still call these.
-- They return nothing (the functions run as the caller, so RLS applies), but
-- there is no reason to leave them reachable. Revoke first, then grant.
revoke execute on function analytics_overview(int)              from public;
revoke execute on function analytics_timeseries(int)            from public;
revoke execute on function analytics_breakdown(text, int, int)  from public;
revoke execute on function analytics_conversions(int)           from public;
revoke execute on function analytics_retention(int)             from public;
revoke execute on function prune_analytics_events()             from public;

grant execute on function analytics_overview(int)              to authenticated;
grant execute on function analytics_timeseries(int)            to authenticated;
grant execute on function analytics_breakdown(text, int, int)  to authenticated;
grant execute on function analytics_conversions(int)           to authenticated;
grant execute on function analytics_retention(int)             to authenticated;
