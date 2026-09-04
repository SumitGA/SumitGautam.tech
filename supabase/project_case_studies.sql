-- Extends `projects` so each entry can carry a full case study.
-- Idempotent — safe to re-run.
--
-- A project is treated as having a case study when `slug` is set AND at least
-- one of problem / approach / outcome is filled in. Projects without one keep
-- behaving exactly as before (card links straight to `url`).

ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug       TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tagline    TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS role       TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS timeframe  TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS problem    TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approach   TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS outcome    TEXT NOT NULL DEFAULT '';
-- Short metric bullets shown as callouts, e.g. ["60% faster ingest", "12k MAU"]
ALTER TABLE projects ADD COLUMN IF NOT EXISTS highlights JSONB NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stack_line TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_url   TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS live_url   TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured   BOOLEAN NOT NULL DEFAULT false;

-- Slugs must be unique, but blank/NULL slugs are allowed for plain projects.
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_key
  ON projects (slug)
  WHERE slug IS NOT NULL AND slug <> '';

-- Backfill slugs from names so existing rows are ready to take a case study.
UPDATE projects
   SET slug = regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g')
 WHERE (slug IS NULL OR slug = '')
   AND name IS NOT NULL
   AND trim(name) <> '';
