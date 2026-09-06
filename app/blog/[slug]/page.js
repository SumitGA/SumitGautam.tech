import { notFound, permanentRedirect } from "next/navigation";
import { getPostBySlug, getPostSlugs, resolveOldSlug, getAdjacentPosts } from "../../../lib/blog-data";
import { renderMarkdown, extractHeadings, readingMinutes } from "../../../lib/markdown";
import { cloudinaryUrl } from "../../../lib/cloudinary";
import { site } from "../../../lib/site";
import PostView from "./PostView";

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const cover = cloudinaryUrl(post.cover_public_id, { width: 1200, height: 630 });

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    alternates: {
      canonical: `/blog/${slug}`,
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
    openGraph: {
      type: "article",
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      url: `/blog/${slug}`,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      tags: post.tags,
      ...(cover ? { images: [{ url: cover, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    /* The slug may belong to a post that has since been renamed. post_slugs
       keeps every slug a post has ever had, so an old link redirects instead
       of 404ing — a published URL is a promise. */
    const current = await resolveOldSlug(slug);
    if (current) permanentRedirect(`/blog/${current}`);
    notFound();
  }

  const [html, adjacent] = await Promise.all([
    renderMarkdown(post.content),
    getAdjacentPosts(post.published_at),
  ]);
  const headings = extractHeadings(post.content);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: site.name, url: site.url },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
    keywords: post.tags?.length ? post.tags.join(", ") : undefined,
    image: cloudinaryUrl(post.cover_public_id, { width: 1200, height: 630 }) || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <PostView
        post={post}
        html={html}
        headings={headings}
        readingMinutes={post.reading_minutes || readingMinutes(post.content)}
        adjacent={adjacent}
        coverUrl={cloudinaryUrl(post.cover_public_id, { width: 1600 })}
      />
    </>
  );
}
