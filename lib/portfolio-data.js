/**
 * Server-side data fetching from Supabase.
 * Falls back to local portfolio.js values when Supabase is not configured
 * (e.g. local dev without .env.local set up).
 */
import { getSupabaseServer } from "./supabase";
import * as local from "../src/portfolio";

const configured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function db() {
  return configured ? getSupabaseServer() : null;
}

// ─── helpers ────────────────────────────────────────────────────────────────

async function fetchOne(table, fallback) {
  const supabase = await db();
  if (!supabase) return fallback;
  const { data, error } = await supabase.from(table).select("*").eq("id", 1).single();
  if (error || !data) return fallback;
  return data;
}

async function fetchAll(table, fallback) {
  const supabase = await db();
  if (!supabase) return fallback;
  const { data, error } = await supabase.from(table).select("*").order("sort_order");
  if (error || !data) return fallback;
  return data;
}

// ─── public fetchers (called from server components / layout) ────────────────

export async function getSettings() {
  const row = await fetchOne("settings", null);
  if (!row) return local.settings;
  return {
    isSplash: row.is_splash,
    useCustomCursor: row.use_custom_cursor,
    googleTrackingID: row.google_tracking_id,
  };
}

export async function getGreeting() {
  const row = await fetchOne("greeting", null);
  if (!row) return local.greeting;
  return {
    title: row.title,
    title2: row.title2,
    logo_name: row.logo_name,
    nickname: row.nickname,
    full_name: row.full_name,
    subTitle: row.subtitle,
    resumeLink: row.resume_link,
    mail: row.mail,
  };
}

export async function getSocialMediaLinks() {
  const row = await fetchOne("social_media_links", null);
  if (!row) return local.socialMediaLinks;
  return {
    github: row.github,
    linkedin: row.linkedin,
    gmail: row.gmail,
    bitbucket: row.bitbucket,
    facebook: row.facebook,
    twitter: row.twitter,
    instagram: row.instagram,
  };
}

export async function getSkills() {
  const rows = await fetchAll("skill_sections", null);
  if (!rows) return local.skills;
  return {
    data: rows.map((r) => ({
      title: r.title,
      fileName: r.file_name,
      skills: r.skills,
      softwareSkills: r.software_skills,
    })),
  };
}

export async function getDegrees() {
  const rows = await fetchAll("degrees", null);
  if (!rows) return local.degrees;
  return {
    degrees: rows.map((r) => ({
      title: r.title,
      subtitle: r.subtitle,
      logo_path: r.logo_path,
      alt_name: r.alt_name,
      duration: r.duration,
      descriptions: r.descriptions,
      website_link: r.website_link,
    })),
  };
}

export async function getCertifications() {
  const rows = await fetchAll("certifications", null);
  if (!rows) return local.certifications;
  return {
    certifications: rows.map((r) => ({
      title: r.title,
      subtitle: r.subtitle,
      logo_path: r.logo_path,
      certificate_link: r.certificate_link,
      alt_name: r.alt_name,
      color_code: r.color_code,
    })),
  };
}

export async function getExperience() {
  const supabase = await db();
  if (!supabase) return local.experience;

  const [headerRes, sectionsRes, expRes] = await Promise.all([
    supabase.from("experience_header").select("*").eq("id", 1).single(),
    supabase.from("experience_sections").select("*").order("sort_order"),
    supabase.from("experiences").select("*").order("sort_order"),
  ]);

  if (headerRes.error || !headerRes.data) return local.experience;

  const h = headerRes.data;
  const sections = (sectionsRes.data || []).map((sec) => ({
    title: sec.title,
    experiences: (expRes.data || [])
      .filter((e) => e.section_id === sec.id)
      .map((e) => ({
        title: e.title,
        company: e.company,
        company_url: e.company_url,
        logo_path: e.logo_path,
        duration: e.duration,
        location: e.location,
        description: e.description,
        color: e.color,
      })),
  }));

  return {
    title: h.title,
    subtitle: h.subtitle,
    description: h.description,
    header_image_path: h.header_image_path,
    sections,
  };
}

export async function getProjectsHeader() {
  const row = await fetchOne("projects_header", null);
  if (!row) return local.projectsHeader;
  return {
    title: row.title,
    description: row.description,
    avatar_image_path: row.avatar_image_path,
  };
}

export async function getProjects() {
  const rows = await fetchAll("projects", null);
  if (!rows) return local.projects;
  return {
    data: rows.map((r, i) => ({
      id: String(r.id ?? i),
      name: r.name,
      url: r.url,
      description: r.description,
      languages: r.languages,
    })),
  };
}

export async function getContact() {
  const row = await fetchOne("contact", null);
  if (!row) return local.contactPageData;
  return {
    contactSection: {
      title: row.title,
      profile_image_path: row.profile_image_path,
      description: row.description,
    },
    blogSection: {
      title: row.blog_title,
      subtitle: row.blog_subtitle,
      link: row.blog_link,
      avatar_image_path: row.blog_avatar_image_path,
    },
  };
}

// ─── resume (separate from portfolio) ────────────────────────────────────────

const resumeFallback = {
  header: {
    full_name: "Sumit Gautam",
    title: "Senior Software Engineer",
    phone: "0450 929 459",
    email: "sumitga@sumitgautam.tech",
    location: "Belmont, Perth WA 6104",
    website: "sumitgautam.tech",
    note: "Australian working rights to October 2027",
  },
  summary:
    "Senior software engineer with 7 years' experience building production backend and full-stack systems in Python, Ruby on Rails, and Rust. Track record delivering performant services, robust APIs, and reliable CI/CD across cloud-native environments (AWS, Kubernetes, Docker). Strong record in research and enterprise software, with measurable wins in pipeline throughput, deployment speed, and service performance. Comfortable owning technical design, mentoring engineers, and translating trade-offs for non-technical stakeholders. Based in Perth and available immediately.",
  skills: [
    { category: "Languages", skill_text: "Python (FastAPI / Django / Flask) · Ruby on Rails · Rust (Actix / Tokio) · TypeScript · JavaScript · Node.js · C# / .NET (upskilling)" },
    { category: "Frontend", skill_text: "React · Vite · Redux · Tailwind CSS · TanStack Query · Zustand · React Testing Library · Storybook" },
    { category: "Cloud & DevOps", skill_text: "AWS (EC2 / S3 / RDS / Lambda) · Nectar Research Cloud · Kubernetes (EKS) · Docker · Terraform · GitHub Actions · GitLab CI · Jenkins · Azure DevOps · SAST / DAST" },
    { category: "Data", skill_text: "PostgreSQL · MySQL · Redis · MongoDB · Elasticsearch · Kafka · NATS Streaming" },
    { category: "Architecture", skill_text: "Microservices · Distributed Systems · REST API Design · OpenAPI · Event-driven Architecture" },
    { category: "AI & GenAI (exploring)", skill_text: "LLM integration via Ollama / LangChain · RAG prototyping · prompt engineering" },
    { category: "Practice", skill_text: "Agile (Scrum / Kanban) · TDD / BDD · Code Review · Technical Mentoring · Grafana / Prometheus · Linux / Ubuntu" },
  ],
  jobs: [
    {
      id: 1,
      job_title: "Independent Software Engineering & Upskilling",
      company: "Self-directed",
      location: "Perth, WA",
      date_range: "Nov 2025 – Present",
      company_description: "",
      bullets: [
        "Self-directed development period following the conclusion of my Intersect contract, focused on broadening my stack while relocating my search to Perth; available immediately.",
        "Built a full-stack portfolio platform with a React / TypeScript frontend, Python backend, and PostgreSQL, including a LangChain + Ollama chatbot integration.",
        "Upskilling in Azure DevOps, Terraform, and C# / .NET to broaden delivery across Microsoft-stack environments; continued hands-on work in Rust.",
      ],
      stack_line: "React · TypeScript · Python · PostgreSQL · Docker · Rust · LangChain · Ollama · Azure DevOps · Terraform",
    },
    {
      id: 2,
      job_title: "Senior Software Engineer",
      company: "Intersect Australia Limited",
      location: "Remote (Sydney, NSW)",
      date_range: "May 2023 – Nov 2025",
      company_description: "National research infrastructure and digital services provider for Australian universities; multi-client, consulting-style delivery across the higher education sector.",
      bullets: [
        "Delivered complex full-stack solutions for multiple university clients: Python (FastAPI) backend services, React / TypeScript frontends, PostgreSQL databases, and AWS cloud infrastructure.",
        "Improved data pipeline throughput by 60% and rewrote a performance-critical service for 50% faster execution and 40% lower memory usage.",
        "Engineered end-to-end CI/CD pipelines (GitHub Actions, GitLab CI) with automated testing and SAST / DAST scanning, reducing deployment lead time by 30%.",
        "Deployed and managed cloud-native applications on AWS (EC2, S3, RDS) using Kubernetes (EKS) and Docker; integrated Azure DevOps pipelines.",
        "Led technical design and architectural decisions, presenting options clearly to technical and non-technical stakeholders.",
        "Prototyped LLM-assisted features using LangChain and Ollama during research phases.",
        "Led code reviews, enforced standards, mentored junior engineers, and contributed to documentation and knowledge-sharing sessions.",
      ],
      stack_line: "Python (FastAPI/Flask/Django) · TypeScript · React · Node.js · AWS · Kubernetes · Docker · PostgreSQL · Redis · GitHub Actions · GitLab CI · Azure DevOps · Grafana · TDD",
    },
    {
      id: 3,
      job_title: "Co-Founder & Lead Engineer",
      company: "Nepali Time (Stealth Startup)",
      location: "Sydney, NSW",
      date_range: "Dec 2022 – Apr 2023",
      company_description: "",
      bullets: [
        "Sole technical lead for an early-stage cross-platform mobile startup; designed and shipped a full-stack iOS / Android app end-to-end (React Native / TypeScript frontend, Python API backend, PostgreSQL), reaching 50,000+ organic downloads during technical alpha.",
        "Owned all engineering decisions: architecture, API design, automated testing, CI/CD, and self-hosted infrastructure on Proxmox VE.",
      ],
      stack_line: "React Native · TypeScript · Python · PostgreSQL · Docker · GitHub Actions · Linux",
    },
    {
      id: 4,
      job_title: "Full Stack Software Developer",
      company: "EZYRAISE",
      location: "North Sydney, NSW",
      date_range: "Jul 2022 – Nov 2022",
      company_description: "",
      bullets: [
        "Delivered full-stack features in Ruby on Rails, React, and Node.js, improving system stability and driving a 30% increase in platform engagement.",
        "Built a TypeScript internal admin portal with full test coverage, improving customer-service team workflows by 90%.",
      ],
      stack_line: "React · TypeScript · Node.js · Ruby on Rails · PostgreSQL · REST API · Agile",
    },
    {
      id: 5,
      job_title: "Software Engineer",
      company: "Whitehat Engineering",
      location: "Redmond, WA, USA (Remote)",
      date_range: "Mar 2020 – Jan 2022",
      company_description: "",
      bullets: [
        "Improved system efficiency by 20% through design-pattern refactoring and Sidekiq Pro performance tuning.",
        "Automated CI/CD pipelines on GitHub Actions and AWS; established Grafana / Prometheus observability across production services.",
      ],
      stack_line: "Ruby on Rails · AWS · GitHub Actions · Grafana · Prometheus · PostgreSQL · CI/CD",
    },
    {
      id: 6,
      job_title: "Software Engineer",
      company: "Enliv Technology",
      location: "Kathmandu, Nepal",
      date_range: "Nov 2017 – Feb 2020",
      company_description: "",
      bullets: [
        "Re-architected a legacy monolith into a scalable microservices ecosystem using Kafka and NATS Streaming, significantly improving throughput and fault tolerance.",
        "Introduced Jenkins and GitHub Actions CI/CD pipelines with Grafana-based real-time monitoring and incident management.",
      ],
      stack_line: "Ruby on Rails · Kafka · NATS Streaming · Jenkins · GitHub Actions · Grafana · PostgreSQL · MongoDB",
    },
  ],
  education: [
    { id: 1, degree: "Master of Technology in Software Engineering", institution: "Federation University, Australia", graduated: "2021" },
    { id: 2, degree: "Bachelor of Science in Computer Science & IT", institution: "Tribhuvan University, Nepal", graduated: "2017" },
  ],
  certifications: "Rust Essential Training · Microservices with Node.js and React · Proxmox VE 6",
  references: "Available on request.",
};

export async function getResumeData() {
  const supabase = await db();
  if (!supabase) return resumeFallback;

  const [headerRes, summaryRes, skillsRes, jobsRes, eduRes, certRes, refsRes] =
    await Promise.all([
      supabase.from("resume_header").select("*").eq("id", 1).single(),
      supabase.from("resume_summary").select("*").eq("id", 1).single(),
      supabase.from("resume_skills").select("*").order("sort_order"),
      supabase.from("resume_jobs").select("*").order("sort_order"),
      supabase.from("resume_education_entries").select("*").order("sort_order"),
      supabase.from("resume_certifications").select("*").eq("id", 1).single(),
      supabase.from("resume_references").select("*").eq("id", 1).single(),
    ]);

  if (headerRes.error || !headerRes.data) return resumeFallback;

  return {
    header: {
      full_name: headerRes.data.full_name,
      title: headerRes.data.title,
      phone: headerRes.data.phone,
      email: headerRes.data.email,
      location: headerRes.data.location,
      website: headerRes.data.website ?? "",
      note: headerRes.data.note ?? "",
    },
    summary: summaryRes.data?.content ?? resumeFallback.summary,
    skills: (skillsRes.data || []).map((r) => ({
      category: r.category,
      skill_text: r.skill_text,
    })),
    jobs: (jobsRes.data || []).map((r) => ({
      id: r.id,
      job_title: r.job_title,
      company: r.company,
      location: r.location ?? "",
      date_range: r.date_range,
      company_description: r.company_description ?? "",
      bullets: Array.isArray(r.bullets) ? r.bullets : [],
      stack_line: r.stack_line ?? "",
    })),
    education: (eduRes.data || []).map((r) => ({
      id: r.id,
      degree: r.degree,
      institution: r.institution,
      graduated: r.graduated,
    })),
    certifications: certRes.data?.content ?? resumeFallback.certifications,
    references: refsRes.data?.content ?? resumeFallback.references,
  };
}

/**
 * Fetch ALL site data in parallel — called once from layout.js
 */
export async function getAllSiteData() {
  const [
    settings,
    greeting,
    socialMediaLinks,
    skills,
    degrees,
    certifications,
    experience,
    projectsHeader,
    projects,
    contactPageData,
  ] = await Promise.all([
    getSettings(),
    getGreeting(),
    getSocialMediaLinks(),
    getSkills(),
    getDegrees(),
    getCertifications(),
    getExperience(),
    getProjectsHeader(),
    getProjects(),
    getContact(),
  ]);

  return {
    settings,
    greeting,
    socialMediaLinks,
    skills,
    degrees,
    certifications,
    experience,
    projectsHeader,
    projects,
    contactPageData,
  };
}
