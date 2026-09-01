-- Safe patch — run this if resume_certifications or resume_references
-- saves are not working in the admin panel.
-- Uses DROP POLICY IF EXISTS so it's safe to run multiple times.

-- ── resume_certifications ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resume_certifications (
  id INT PRIMARY KEY DEFAULT 1,
  content TEXT NOT NULL DEFAULT ''
);

ALTER TABLE resume_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read resume_certifications" ON resume_certifications;
CREATE POLICY "public read resume_certifications"
  ON resume_certifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth write resume_certifications" ON resume_certifications;
CREATE POLICY "auth write resume_certifications"
  ON resume_certifications FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO resume_certifications (id, content)
VALUES (1, 'Rust Essential Training · Microservices with Node.js and React · Proxmox VE 6')
ON CONFLICT (id) DO NOTHING;

-- ── resume_references ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resume_references (
  id INT PRIMARY KEY DEFAULT 1,
  content TEXT NOT NULL DEFAULT 'Available on request.'
);

ALTER TABLE resume_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read resume_references" ON resume_references;
CREATE POLICY "public read resume_references"
  ON resume_references FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth write resume_references" ON resume_references;
CREATE POLICY "auth write resume_references"
  ON resume_references FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO resume_references (id, content)
VALUES (1, 'Available on request.')
ON CONFLICT (id) DO NOTHING;
