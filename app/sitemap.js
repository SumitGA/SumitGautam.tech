import { site, routes } from "../lib/site";
import { getCaseStudySlugs } from "../lib/portfolio-data";
import { getPosts, getAllTags } from "../lib/blog-data";

/* Case studies are the pages most likely to rank for a specific query, and
   they were missing from the sitemap entirely. Their slugs live in Supabase
   and can change without a deploy, so this regenerates hourly rather than
   being frozen at build time. */
export const revalidate = 3600;

export default async function sitemap() {
  const [slugs, posts, tags] = await Promise.all([
    getCaseStudySlugs(),
    getPosts(),
    getAllTags(),
  ]);
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
    // Posts carry their own dates — a sitemap lastmod that reflects the actual
    // edit is worth more to a crawler than one stamped at generation time.
    ...posts.map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    })),
    ...tags.map(({ tag }) => ({
      url: `${site.url}/blog/tag/${encodeURIComponent(tag)}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.4,
    })),
  ];
}
