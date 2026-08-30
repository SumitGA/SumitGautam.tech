import { site, routes } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap() {
  return routes.map((r) => ({
    url: `${site.url}${r.path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: r.priority,
  }));
}
