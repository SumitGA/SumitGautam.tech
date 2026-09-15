import { site, routes } from "../../lib/site";
import { getCaseStudySlugs } from "../../lib/portfolio-data";
import { getPosts, getAllTags } from "../../lib/blog-data";

/* The sitemap, as an ordinary Route Handler rather than Next's `app/sitemap.js`
 * metadata convention.
 *
 * The convention froze. `app/sitemap.js` exported `revalidate = 3600` and the
 * build manifest recorded it, but in production the file was served as a
 * build-time artifact: six days after the 2026-09-07 deploy it still listed 4
 * of 6 posts and 12 of 17 tags, and an explicit revalidatePath("/sitemap.xml")
 * returned `revalidated: true` without moving it. The metadata route is
 * documented as "cached by default", and that is evidently stronger than the
 * revalidate window.
 *
 * A hand-written handler is the shape that demonstrably works in this codebase
 * — blog/rss.xml/route.js has stayed current throughout — and it participates
 * in ISR and on-demand revalidation like any other route. The cost is writing
 * the XML by hand, which is a dozen lines.
 *
 * The failure mode this removes is the dangerous kind: a sitemap that is stale
 * rather than missing tells a crawler the new pages do not exist, and says so
 * with complete confidence.
 */

export const revalidate = 3600;

function escapeXml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry({ loc, lastModified, changeFrequency, priority }) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${new Date(lastModified).toISOString()}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const [slugs, posts, tags] = await Promise.all([
    getCaseStudySlugs(),
    getPosts(),
    getAllTags(),
  ]);
  const lastModified = new Date();

  const entries = [
    ...routes.map((r) => ({
      loc: `${site.url}${r.path}`,
      lastModified,
      changeFrequency: "monthly",
      priority: r.priority,
    })),
    ...slugs.map((slug) => ({
      loc: `${site.url}/projects/${slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
    // Posts carry their own dates — a sitemap lastmod that reflects the actual
    // edit is worth more to a crawler than one stamped at generation time.
    ...posts.map((post) => ({
      loc: `${site.url}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    })),
    ...tags.map(({ tag }) => ({
      loc: `${site.url}/blog/tag/${encodeURIComponent(tag)}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.4,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(urlEntry).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
