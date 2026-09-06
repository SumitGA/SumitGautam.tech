"use client";
import Link from "next/link";
import { useAppTheme, useSiteData } from "../providers";
import { greeting as staticGreeting } from "../../src/portfolio";
import { track } from "../../lib/analytics-client";

/* What a reader sees when they finish a post.
 *
 * Before this, the article ended and the next thing was previous/next links.
 * Someone who had just read two thousand words — the most qualified visitor
 * this site gets — was given no idea who wrote it and nothing to do next.
 *
 * Two actions, deliberately: one to start a conversation, one to come back
 * later without having to remember to. Anything more dilutes both.
 *
 * The name and subtitle come from the CMS rather than being written here, so
 * editing the greeting in the admin updates this too — the same rule the
 * footer follows.
 */
export default function AuthorCard() {
  const { theme } = useAppTheme();
  const { greeting } = useSiteData() || {};
  const g = greeting || staticGreeting;

  /* subTitle, not subtitle: getGreeting() renames the DB column to match the
     static portfolio shape, so both sides of this fallback use the camelCase
     key. Reading the column name here silently served the stale static bio. */
  const name = g?.full_name || g?.title2 || staticGreeting.title2;
  const subtitle = g?.subTitle || staticGreeting.subTitle;

  return (
    <aside className="post-author" aria-label="About the author">
      <p className="post-author-eyebrow" style={{ color: theme.secondaryText }}>
        Written by
      </p>
      <p className="post-author-name" style={{ color: theme.text }}>
        {name}
      </p>
      {subtitle && (
        <p className="post-author-bio" style={{ color: theme.secondaryText }}>
          {subtitle}
        </p>
      )}
      <div className="post-author-actions">
        <Link
          href="/contact"
          className="post-author-cta"
          style={{ backgroundColor: theme.accentSolid, color: "#fff" }}
          onClick={() => track("post_contact_click")}
        >
          Get in touch
        </Link>
        {/* Not a Link: the feed is a route handler, not a page, so it must be a
            real navigation rather than a client-side transition. */}
        <a
          href="/blog/rss.xml"
          className="post-author-cta post-author-cta-secondary"
          style={{ color: theme.text, borderColor: "rgba(128,128,128,0.35)" }}
          onClick={() => track("post_subscribe_click")}
        >
          Subscribe via RSS
        </a>
      </div>
    </aside>
  );
}
