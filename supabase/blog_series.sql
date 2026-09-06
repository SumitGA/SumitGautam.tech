-- ============================================================================
-- Blog: series and project links
--
-- Run in the Supabase SQL Editor. Idempotent — safe to re-run.
--
-- Two relationships the blog could not express:
--
--  * A post belongs to a series. Previous/next is ordered by date, which is
--    correct for "more posts" but says nothing about reading order — publish
--    anything between two parts and the series stops being navigable.
--    series + series_order make the set explicit and independent of dates.
--
--  * A post belongs to a project. A case study and the posts that go deep on
--    the same work had no link in either direction, so a reader of one could
--    not find the other.
--
-- project_slug carries no foreign key on purpose: projects.slug is unique
-- through a PARTIAL index (blank slugs are allowed for projects without a
-- case study), and Postgres cannot back a foreign key with a partial index.
-- The reference is resolved at render time instead, so a slug that matches
-- nothing renders no link rather than breaking the page.
-- ============================================================================

alter table posts add column if not exists series       text;
alter table posts add column if not exists series_order int;
alter table posts add column if not exists project_slug text;

-- A post in a series must say where it sits. Without this a series silently
-- falls back to date order, which is the problem this table set out to fix.
alter table posts drop constraint if exists posts_series_needs_order;
alter table posts add constraint posts_series_needs_order
  check (series is null or series = '' or series_order is not null);

-- Two parts cannot claim the same position. Blank series are excluded so
-- standalone posts are unaffected.
create unique index if not exists posts_series_order_key
  on posts (series, series_order)
  where series is not null and series <> '';

create index if not exists posts_series_idx
  on posts (series) where series is not null and series <> '';

create index if not exists posts_project_slug_idx
  on posts (project_slug) where project_slug is not null and project_slug <> '';
