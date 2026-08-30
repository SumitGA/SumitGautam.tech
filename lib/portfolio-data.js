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
