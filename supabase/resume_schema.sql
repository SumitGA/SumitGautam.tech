-- ============================================================
-- Resume / CV tables (separate from portfolio data)
-- Run in Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS resume_header (
  id INT PRIMARY KEY DEFAULT 1,
  full_name TEXT NOT NULL DEFAULT 'Sumit Gautam',
  title TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS resume_summary (
  id INT PRIMARY KEY DEFAULT 1,
  content TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS resume_skills (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT '',
  skill_text TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS resume_jobs (
  id SERIAL PRIMARY KEY,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  date_range TEXT NOT NULL DEFAULT '',
  company_description TEXT NOT NULL DEFAULT '',
  bullets JSONB NOT NULL DEFAULT '[]',
  stack_line TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS resume_education_entries (
  id SERIAL PRIMARY KEY,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  graduated TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS resume_certifications (
  id INT PRIMARY KEY DEFAULT 1,
  content TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS resume_references (
  id INT PRIMARY KEY DEFAULT 1,
  content TEXT NOT NULL DEFAULT 'References available upon request'
);

-- RLS
ALTER TABLE resume_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_education_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read resume_header" ON resume_header FOR SELECT USING (true);
CREATE POLICY "public read resume_summary" ON resume_summary FOR SELECT USING (true);
CREATE POLICY "public read resume_skills" ON resume_skills FOR SELECT USING (true);
CREATE POLICY "public read resume_jobs" ON resume_jobs FOR SELECT USING (true);
CREATE POLICY "public read resume_education_entries" ON resume_education_entries FOR SELECT USING (true);
CREATE POLICY "public read resume_certifications" ON resume_certifications FOR SELECT USING (true);
CREATE POLICY "public read resume_references" ON resume_references FOR SELECT USING (true);

CREATE POLICY "auth write resume_header" ON resume_header FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write resume_summary" ON resume_summary FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write resume_skills" ON resume_skills FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write resume_jobs" ON resume_jobs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write resume_education_entries" ON resume_education_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write resume_certifications" ON resume_certifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write resume_references" ON resume_references FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- Seed data — Sumit Gautam Senior Software Engineer CV
-- ============================================================

INSERT INTO resume_header (id, full_name, title, phone, email, location, website, note)
VALUES (1,
  'Sumit Gautam',
  'Senior Software Engineer',
  '0450 929 459',
  'sumitga@sumitgautam.tech',
  'Belmont, Perth WA 6104',
  'sumitgautam.tech',
  'Australian working rights to October 2027'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resume_summary (id, content)
VALUES (1, 'Senior software engineer with 7 years'' experience building production backend and full-stack systems in Python, Ruby on Rails, and Rust. Track record delivering performant services, robust APIs, and reliable CI/CD across cloud-native environments (AWS, Kubernetes, Docker). Strong record in research and enterprise software, with measurable wins in pipeline throughput, deployment speed, and service performance. Comfortable owning technical design, mentoring engineers, and translating trade-offs for non-technical stakeholders. Based in Perth and available immediately.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO resume_skills (category, skill_text, sort_order) VALUES
('Languages', 'Python (FastAPI / Django / Flask) · Ruby on Rails · Rust (Actix / Tokio) · TypeScript · JavaScript · Node.js · C# / .NET (upskilling)', 0),
('Frontend', 'React · Vite · Redux · Tailwind CSS · TanStack Query · Zustand · React Testing Library · Storybook', 1),
('Cloud & DevOps', 'AWS (EC2 / S3 / RDS / Lambda) · Nectar Research Cloud · Kubernetes (EKS) · Docker · Terraform · GitHub Actions · GitLab CI · Jenkins · Azure DevOps · SAST / DAST', 2),
('Data', 'PostgreSQL · MySQL · Redis · MongoDB · Elasticsearch · Kafka · NATS Streaming', 3),
('Architecture', 'Microservices · Distributed Systems · REST API Design · OpenAPI · Event-driven Architecture', 4),
('AI & GenAI (exploring)', 'LLM integration via Ollama / LangChain · RAG prototyping · prompt engineering', 5),
('Practice', 'Agile (Scrum / Kanban) · TDD / BDD · Code Review · Technical Mentoring · Grafana / Prometheus · Linux / Ubuntu', 6);

INSERT INTO resume_jobs (job_title, company, location, date_range, company_description, bullets, stack_line, sort_order) VALUES
(
  'Independent Software Engineering & Upskilling',
  'Self-directed',
  'Perth, WA',
  'Nov 2025 – Present',
  '',
  '["Self-directed development period following the conclusion of my Intersect contract, focused on broadening my stack while relocating my search to Perth; available immediately.","Built a full-stack portfolio platform with a React / TypeScript frontend, Python backend, and PostgreSQL, including a LangChain + Ollama chatbot integration.","Upskilling in Azure DevOps, Terraform, and C# / .NET to broaden delivery across Microsoft-stack environments; continued hands-on work in Rust."]',
  'React · TypeScript · Python · PostgreSQL · Docker · Rust · LangChain · Ollama · Azure DevOps · Terraform',
  0
),
(
  'Senior Software Engineer',
  'Intersect Australia Limited',
  'Remote (Sydney, NSW)',
  'May 2023 – Nov 2025',
  'National research infrastructure and digital services provider for Australian universities; multi-client, consulting-style delivery across the higher education sector.',
  '["Delivered complex full-stack solutions for multiple university clients: Python (FastAPI) backend services, React / TypeScript frontends, PostgreSQL databases, and AWS cloud infrastructure.","Improved data pipeline throughput by 60% and rewrote a performance-critical service for 50% faster execution and 40% lower memory usage.","Engineered end-to-end CI/CD pipelines (GitHub Actions, GitLab CI) with automated testing and SAST / DAST scanning, reducing deployment lead time by 30%.","Deployed and managed cloud-native applications on AWS (EC2, S3, RDS) using Kubernetes (EKS) and Docker; integrated Azure DevOps pipelines.","Led technical design and architectural decisions, presenting options clearly to technical and non-technical stakeholders.","Prototyped LLM-assisted features using LangChain and Ollama during research phases.","Led code reviews, enforced standards, mentored junior engineers, and contributed to documentation and knowledge-sharing sessions."]',
  'Python (FastAPI/Flask/Django) · TypeScript · React · Node.js · AWS · Kubernetes · Docker · PostgreSQL · Redis · GitHub Actions · GitLab CI · Azure DevOps · Grafana · TDD',
  1
),
(
  'Co-Founder & Lead Engineer',
  'Nepali Time (Stealth Startup)',
  'Sydney, NSW',
  'Dec 2022 – Apr 2023',
  '',
  '["Sole technical lead for an early-stage cross-platform mobile startup; designed and shipped a full-stack iOS / Android app end-to-end (React Native / TypeScript frontend, Python API backend, PostgreSQL), reaching 50,000+ organic downloads during technical alpha.","Owned all engineering decisions: architecture, API design, automated testing, CI/CD, and self-hosted infrastructure on Proxmox VE."]',
  'React Native · TypeScript · Python · PostgreSQL · Docker · GitHub Actions · Linux',
  2
),
(
  'Full Stack Software Developer',
  'EZYRAISE',
  'North Sydney, NSW',
  'Jul 2022 – Nov 2022',
  '',
  '["Delivered full-stack features in Ruby on Rails, React, and Node.js, improving system stability and driving a 30% increase in platform engagement.","Built a TypeScript internal admin portal with full test coverage, improving customer-service team workflows by 90%."]',
  'React · TypeScript · Node.js · Ruby on Rails · PostgreSQL · REST API · Agile',
  3
),
(
  'Software Engineer',
  'Whitehat Engineering',
  'Redmond, WA, USA (Remote)',
  'Mar 2020 – Jan 2022',
  '',
  '["Improved system efficiency by 20% through design-pattern refactoring and Sidekiq Pro performance tuning.","Automated CI/CD pipelines on GitHub Actions and AWS; established Grafana / Prometheus observability across production services."]',
  'Ruby on Rails · AWS · GitHub Actions · Grafana · Prometheus · PostgreSQL · CI/CD',
  4
),
(
  'Software Engineer',
  'Enliv Technology',
  'Kathmandu, Nepal',
  'Nov 2017 – Feb 2020',
  '',
  '["Re-architected a legacy monolith into a scalable microservices ecosystem using Kafka and NATS Streaming, significantly improving throughput and fault tolerance.","Introduced Jenkins and GitHub Actions CI/CD pipelines with Grafana-based real-time monitoring and incident management."]',
  'Ruby on Rails · Kafka · NATS Streaming · Jenkins · GitHub Actions · Grafana · PostgreSQL · MongoDB',
  5
);

INSERT INTO resume_education_entries (degree, institution, graduated, sort_order) VALUES
  ('Master of Technology in Software Engineering', 'Federation University, Australia', '2021', 0),
  ('Bachelor of Science in Computer Science & IT', 'Tribhuvan University, Nepal', '2017', 1);

INSERT INTO resume_certifications (id, content)
VALUES (1, 'Rust Essential Training · Microservices with Node.js and React · Proxmox VE 6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO resume_references (id, content)
VALUES (1, 'Available on request.')
ON CONFLICT (id) DO NOTHING;
