"use client";
import Link from "next/link";
import { useAppTheme } from "../providers";

/* Where this post sits: which series, and which project it is about.
 *
 * It goes above the article rather than below because both answer questions a
 * reader has before they start — "is there something I should read first?" and
 * "what is this thing?" — not after they finish.
 *
 * Parts are listed by series_order, so the reading path holds whatever order
 * the posts were published in. Unpublished parts are absent rather than shown
 * greyed out: a link a reader cannot follow is a worse experience than not
 * knowing the part is coming, and the post's own closing lines already say
 * what is next.
 */
export default function PostContext({ series, seriesPosts = [], project, currentSlug }) {
  const { theme } = useAppTheme();

  const parts = series ? seriesPosts : [];
  const hasSeries = parts.length > 1;
  if (!hasSeries && !project) return null;

  const index = parts.findIndex((p) => p.slug === currentSlug);

  return (
    <aside className="post-context" aria-label="About this post">
      {hasSeries && (
        <>
          <p className="post-context-label" style={{ color: theme.secondaryText }}>
            {index >= 0
              ? `Part ${index + 1} of ${parts.length} in `
              : "Part of "}
            <span style={{ color: theme.text }}>{series}</span>
          </p>
          <ol className="post-context-parts">
            {parts.map((p, i) => {
              const isCurrent = p.slug === currentSlug;
              return (
                <li key={p.slug} className={isCurrent ? "is-current" : ""}>
                  <span className="post-context-num" style={{ color: theme.secondaryText }}>
                    {i + 1}
                  </span>
                  {isCurrent ? (
                    /* No link to the page you are already on. */
                    <span style={{ color: theme.text }} aria-current="true">
                      {p.title}
                    </span>
                  ) : (
                    <Link href={`/blog/${p.slug}`} style={{ color: theme.accentColor }}>
                      {p.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}

      {project && (
        <p className={`post-context-project ${hasSeries ? "has-series" : ""}`} style={{ color: theme.secondaryText }}>
          Written about{" "}
          <Link href={`/projects/${project.slug}`} style={{ color: theme.accentColor }}>
            {project.name}
          </Link>
          {project.tagline ? ` — ${project.tagline}` : ""}
        </p>
      )}
    </aside>
  );
}
