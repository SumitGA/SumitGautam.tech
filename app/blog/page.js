import { getPosts, getAllTags } from "../../lib/blog-data";
import BlogIndex from "./BlogIndex";

export const metadata = {
  title: "Blog",
  description:
    "Notes on Rust, Python, distributed systems and the things that broke on the way.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [posts, tags] = await Promise.all([getPosts(), getAllTags()]);
  return <BlogIndex posts={posts} tags={tags} activeTag={null} />;
}
