import { notFound } from "next/navigation";
import { getPosts, getAllTags } from "../../../../lib/blog-data";
import BlogIndex from "../../BlogIndex";

/* Tags are their own routes rather than a ?tag= query string.
 *
 * A query param would force the index to render dynamically on every request,
 * and gives search engines a weaker URL to index. A real path is cacheable,
 * linkable and indexable — and it is the kind of URL that should still work in
 * ten years. */
export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `Posts tagged ${decoded}`,
    description: `Posts tagged ${decoded}.`,
    alternates: {
      canonical: `/blog/tag/${tag}`,
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
  };
}

export default async function TagPage({ params }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const [posts, tags] = await Promise.all([getPosts({ tag: decoded }), getAllTags()]);

  // An unused tag is a 404, not an empty page — otherwise every typo becomes a
  // thin indexable URL.
  if (!tags.some((t) => t.tag === decoded)) notFound();

  return <BlogIndex posts={posts} tags={tags} activeTag={decoded} />;
}
