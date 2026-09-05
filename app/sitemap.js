import { site, routes } from "../lib/site";
import { getCaseStudySlugs } from "../lib/portfolio-data";

/* Case studies are the pages most likely to rank for a specific query, and
   they were missing from the sitemap entirely. Their slugs live in Supabase
   and can change without a deploy, so this regenerates hourly rather than
   being frozen at build time. */
export const revalidate = 3600;

export default async function sitemap() {
  const slugs = await getCaseStudySlugs();
  const lastModified = new Date();

  return [
    ...routes.map((r) => ({
      url: `${site.url}${r.path}`,
      lastModified,
      changeFrequency: "monthly",
      priority: r.priority,
    })),
    ...slugs.map((slug) => ({
      url: `${site.url}/projects/${slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  ];
}
