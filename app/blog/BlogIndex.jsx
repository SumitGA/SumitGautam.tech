"use client";
import Link from "next/link";
import Header from "../../src/components/header/Header";
import Footer from "../../src/components/footer/Footer";
import { useAppTheme } from "../providers";
import { cloudinaryUrl } from "../../lib/cloudinary";
import "./blog.css";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogIndex({ posts, tags, activeTag }) {
  const { theme } = useAppTheme();

  return (
    <div className="blog-main">
      <Header />
      <div className="blog-body">
        <header className="blog-header fade-in-up">
          <h1 className="blog-title" style={{ color: theme.text }}>
            Blog
          </h1>
          <p className="blog-subtitle" style={{ color: theme.secondaryText }}>
            Notes on the things that broke, and what fixed them.
          </p>
        </header>

        {tags.length > 0 && (
          <nav className="blog-tags" aria-label="Filter by tag">
            <Link
              href="/blog"
              className={`blog-tag ${!activeTag ? "is-active" : ""}`}
              style={!activeTag ? { backgroundColor: theme.accentBright, color: "#fff" } : { color: theme.secondaryText }}
            >
              All
            </Link>
            {tags.map(({ tag, count }) => (
              <Link
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
                className={`blog-tag ${activeTag === tag ? "is-active" : ""}`}
                style={
                  activeTag === tag
                    ? { backgroundColor: theme.accentBright, color: "#fff" }
                    : { color: theme.secondaryText }
                }
              >
                {tag} <span className="blog-tag-count">{count}</span>
              </Link>
            ))}
          </nav>
        )}

        {posts.length === 0 ? (
          <p className="blog-empty" style={{ color: theme.secondaryText }}>
            {activeTag ? `Nothing tagged “${activeTag}” yet.` : "No posts yet."}
          </p>
        ) : (
          <ul className="blog-list">
            {posts.map((post) => {
              const cover = cloudinaryUrl(post.cover_public_id, { width: 480, height: 280 });
              return (
                <li key={post.id} className="blog-item fade-in-up">
                  <Link href={`/blog/${post.slug}`} className="blog-item-link">
                    {cover && (
                      <img
                        className="blog-item-cover"
                        src={cover}
                        alt={post.cover_alt || ""}
                        loading="lazy"
                        width={480}
                        height={280}
                      />
                    )}
                    <div className="blog-item-text">
                      <h2 className="blog-item-title" style={{ color: theme.text }}>
                        {post.title}
                      </h2>
                      <p className="blog-item-meta" style={{ color: theme.secondaryText }}>
                        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                        {post.reading_minutes ? ` · ${post.reading_minutes} min read` : ""}
                      </p>
                      {post.excerpt && (
                        <p className="blog-item-excerpt" style={{ color: theme.text }}>
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Footer />
    </div>
  );
}
