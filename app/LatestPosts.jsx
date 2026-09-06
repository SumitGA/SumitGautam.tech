"use client";
import Link from "next/link";
import { useAppTheme } from "./providers";
import "./latest-posts.css";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* The newest writing, on the busiest page.
 *
 * The home page previously linked to no post at all — the nav was the only
 * route in, which asks a visitor to go looking for something they have no
 * reason to believe exists. Anyone who arrives here and leaves without knowing
 * there is writing is the cheapest reader to lose.
 *
 * Renders nothing when there are no posts, so an empty blog does not advertise
 * itself. Same rule as the nav link.
 */
export default function LatestPosts({ posts = [] }) {
  const { theme } = useAppTheme();
  if (!posts.length) return null;

  return (
    <section className="latest fade-in-up" aria-labelledby="latest-heading">
      <div className="latest-inner">
        <div className="latest-head">
          <h2 id="latest-heading" className="latest-title" style={{ color: theme.text }}>
            Recent writing
          </h2>
          <Link href="/blog" className="latest-all" style={{ color: theme.accentColor }}>
            All posts →
          </Link>
        </div>

        <ul className="latest-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="latest-item">
                <span className="latest-item-title" style={{ color: theme.text }}>
                  {post.title}
                </span>
                <span className="latest-item-meta" style={{ color: theme.secondaryText }}>
                  {formatDate(post.published_at)}
                  {post.reading_minutes ? ` · ${post.reading_minutes} min read` : ""}
                </span>
                {post.excerpt && (
                  <span className="latest-item-excerpt" style={{ color: theme.secondaryText }}>
                    {post.excerpt}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
