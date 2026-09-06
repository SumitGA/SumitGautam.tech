"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../../../src/components/header/Header";
import Footer from "../../../src/components/footer/Footer";
import { useAppTheme } from "../../providers";
import AuthorCard from "../AuthorCard";
import PostContext from "../PostContext";
import "../blog.css";
import "./post.css";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PostView({
  post,
  html,
  headings,
  readingMinutes,
  coverUrl,
  adjacent,
  seriesPosts = [],
  project = null,
}) {
  const { theme } = useAppTheme();
  const proseRef = useRef(null);
  const [copied, setCopied] = useState(null);

  /* Copy buttons are attached after render rather than emitted by the markdown
     pipeline. The pipeline runs on the server and produces static HTML; a
     button needs a click handler, so it has to be wired up in the browser.
     Doing it here keeps the rendered HTML free of markup that only matters
     once JavaScript is available — without JS the code blocks are simply
     plain code blocks, which is the correct fallback. */
  useEffect(() => {
    const root = proseRef.current;
    if (!root) return;

    /* The cleanup fully reverses this mutation — button removed, <pre> moved
       back out, wrapper deleted. An earlier version only detached the click
       listener and left the wrapper in place, which broke under StrictMode:
       the second effect pass saw an already-wrapped block, skipped it, and
       left a button with no handler. Undoing everything keeps the effect
       idempotent however many times React runs it. */
    const added = [];

    root.querySelectorAll("pre").forEach((pre) => {
      const wrap = document.createElement("div");
      wrap.className = "post-code";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "post-code-copy";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code to clipboard");

      const index = added.length;
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText);
          setCopied(index);
          setTimeout(() => setCopied((c) => (c === index ? null : c)), 1600);
        } catch {
          /* Clipboard access can be refused — an insecure context, a denied
             permission, or a browser that wants a stronger user gesture. Say
             so rather than appearing to have worked. */
          button.textContent = "Press ⌘C";
          setTimeout(() => { button.textContent = "Copy"; }, 1600);
        }
      };

      button.addEventListener("click", onClick);
      wrap.appendChild(button);
      added.push({ wrap, pre, button, onClick });
    });

    return () => {
      for (const { wrap, pre, button, onClick } of added) {
        button.removeEventListener("click", onClick);
        wrap.parentNode?.insertBefore(pre, wrap);
        wrap.remove();
      }
    };
  }, [html]);

  useEffect(() => {
    const root = proseRef.current;
    if (!root) return;
    root.querySelectorAll(".post-code-copy").forEach((b, i) => {
      b.textContent = copied === i ? "Copied" : "Copy";
      b.classList.toggle("is-copied", copied === i);
    });
  }, [copied]);
  const edited =
    post.updated_at &&
    post.published_at &&
    new Date(post.updated_at) - new Date(post.published_at) > 86_400_000;

  return (
    <div className="blog-main">
      <Header />
      <article className="post-body">
        <Link href="/blog" className="blog-back" style={{ color: theme.accentColor }}>
          ← All posts
        </Link>

        <header className="post-header">
          <h1 className="post-title" style={{ color: theme.text }}>
            {post.title}
          </h1>
          <p className="post-meta" style={{ color: theme.secondaryText }}>
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            {readingMinutes ? ` · ${readingMinutes} min read` : ""}
            {edited ? ` · updated ${formatDate(post.updated_at)}` : ""}
          </p>
          {post.tags?.length > 0 && (
            <ul className="post-tags">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/blog/tag/${encodeURIComponent(tag)}`}
                    className="post-tag"
                    style={{ color: theme.secondaryText }}
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </header>

        {coverUrl && (
          <img className="post-cover" src={coverUrl} alt={post.cover_alt || ""} />
        )}

        <PostContext
          series={post.series}
          seriesPosts={seriesPosts}
          project={project}
          currentSlug={post.slug}
        />

        {headings.length > 2 && (
          <nav className="post-toc" aria-label="On this page">
            <p className="post-toc-title" style={{ color: theme.text }}>
              On this page
            </p>
            <ul>
              {headings.map((h) => (
                <li key={h.id} className={`post-toc-h${h.depth}`}>
                  <a href={`#${h.id}`} style={{ color: theme.secondaryText }}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Rendered server-side from markdown — see lib/markdown.js. Safe to
            inject: the content is author-only, and the pipeline does not pass
            raw HTML through. */}
        <div
          ref={proseRef}
          className="post-prose"
          /* Primary text, not secondary: this is the body of the post, and a
             muted colour that reads fine on a one-line caption is tiring over
             a thousand words. */
          style={{ color: theme.text }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <AuthorCard />
        {(adjacent?.prev || adjacent?.next) && (
          <nav className="post-nav" aria-label="More posts">
            {adjacent.next ? (
              <Link href={`/blog/${adjacent.next.slug}`} className="post-nav-link">
                <span className="post-nav-dir" style={{ color: theme.secondaryText }}>← Newer</span>
                <span className="post-nav-title" style={{ color: theme.text }}>{adjacent.next.title}</span>
              </Link>
            ) : <span />}
            {adjacent.prev && (
              <Link href={`/blog/${adjacent.prev.slug}`} className="post-nav-link post-nav-right">
                <span className="post-nav-dir" style={{ color: theme.secondaryText }}>Older →</span>
                <span className="post-nav-title" style={{ color: theme.text }}>{adjacent.prev.title}</span>
              </Link>
            )}
          </nav>
        )}
      </article>
      <Footer />
    </div>
  );
}
