import { getPosts, getAllTags } from "../../lib/blog-data";
import BlogIndex from "./BlogIndex";

export const metadata = {
  title: "Blog",
  description:
    "Notes on Rust, Python, distributed systems and the things that broke on the way.",
  /* Feed readers discover a feed from this link, not from the visible one.
     It lives on the blog routes rather than the root layout because a child
     that sets alternates replaces the parent's object wholesale, and every
     page here sets its own canonical. */
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
};

export default async function BlogPage() {
  const [posts, tags] = await Promise.all([getPosts(), getAllTags()]);
  return <BlogIndex posts={posts} tags={tags} activeTag={null} />;
}
