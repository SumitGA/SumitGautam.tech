-- ============================================================================
-- Blog
--
-- Run in the Supabase SQL Editor. Idempotent — safe to re-run.
--
-- Design notes, since these are the choices that are expensive to reverse:
--
--  * content is markdown in a text column. Not HTML, not a block format.
--    Markdown outlives renderers: "select slug, content from posts" is a
--    directory of .md files if this ever leaves Supabase or Next.
--
--  * content_format exists so a single post can move to MDX later without
--    migrating the rest.
--
--  * cover_public_id stores a Cloudinary public_id, never a URL. A stored URL
--    bakes in the cloud name, delivery domain and transformations, so changing
--    any of them breaks every post at once. The URL is built at render time.
--
--  * post_slugs keeps every slug a post has ever had, so renaming never 404s.
--    Maintained by trigger rather than application code: a published URL is a
--    promise, and an invariant that matters that much belongs in the database
--    where it cannot be bypassed.
-- ============================================================================

create table if not exists posts (
  id               bigint generated always as identity primary key,
  slug             text        not null unique,
  title            text        not null,
  excerpt          text,
  content          text        not null default '',
  content_format   text        not null default 'markdown',
  status           text        not null default 'draft',
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  tags             text[]      not null default '{}',
  cover_public_id  text,
  cover_alt        text,
  meta_title       text,
  meta_description text,
  reading_minutes  int,
  constraint posts_status_check check (status in ('draft', 'published')),
  constraint posts_format_check check (content_format in ('markdown', 'mdx')),
  -- A published post must have a date; RSS ordering and Article structured
  -- data both depend on it, and a null here is silently wrong rather than loud.
  constraint posts_published_needs_date
    check (status <> 'published' or published_at is not null)
);

create index if not exists posts_published_idx
  on posts (published_at desc) where status = 'published';
create index if not exists posts_tags_idx on posts using gin (tags);
create index if not exists posts_status_idx on posts (status);

create table if not exists post_slugs (
  slug       text primary key,
  post_id    bigint not null references posts(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists post_slugs_post_idx on post_slugs (post_id);

-- Which Cloudinary assets a post owns. Body images keep full URLs in the
-- markdown so it renders anywhere; this table is what makes them enumerable —
-- for deleting them when a post is deleted, and for a scripted rewrite if the
-- image host ever changes.
create table if not exists post_images (
  post_id    bigint not null references posts(id) on delete cascade,
  public_id  text   not null,
  created_at timestamptz not null default now(),
  primary key (post_id, public_id)
);

-- ── Triggers ────────────────────────────────────────────────────────────────

create or replace function posts_touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_touch_updated_at on posts;
create trigger posts_touch_updated_at
  before update on posts
  for each row execute function posts_touch_updated_at();

-- Record every slug a post has ever had.
create or replace function posts_record_slug() returns trigger as $$
begin
  if tg_op = 'INSERT' or new.slug is distinct from old.slug then
    insert into post_slugs (slug, post_id)
    values (new.slug, new.id)
    on conflict (slug) do update set post_id = excluded.post_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_record_slug on posts;
create trigger posts_record_slug
  after insert or update of slug on posts
  for each row execute function posts_record_slug();

-- ── Row level security ──────────────────────────────────────────────────────

alter table posts       enable row level security;
alter table post_slugs  enable row level security;
alter table post_images enable row level security;

-- Public sees published posts only, and only once their date has arrived —
-- which is what makes a future published_at behave as scheduled publishing.
drop policy if exists "published posts are public" on posts;
create policy "published posts are public"
  on posts for select
  using (status = 'published' and published_at <= now());

drop policy if exists "posts writable by authenticated" on posts;
create policy "posts writable by authenticated"
  on posts for all to authenticated
  using (true) with check (true);

drop policy if exists "slugs are public" on post_slugs;
create policy "slugs are public"
  on post_slugs for select using (true);

drop policy if exists "slugs writable by authenticated" on post_slugs;
create policy "slugs writable by authenticated"
  on post_slugs for all to authenticated
  using (true) with check (true);

drop policy if exists "images writable by authenticated" on post_images;
create policy "images writable by authenticated"
  on post_images for all to authenticated
  using (true) with check (true);
