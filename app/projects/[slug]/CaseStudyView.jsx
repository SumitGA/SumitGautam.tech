"use client";
import Link from "next/link";
import Header from "../../../src/components/header/Header";
import Footer from "../../../src/components/footer/Footer";
import ProjectLanguages from "../../../src/components/projectLanguages/ProjectLanguages";
import { useAppTheme } from "../../providers";
import { useEffect, useRef } from "react";
import { track } from "../../../lib/analytics-client";
import "./case-study.css";

export default function CaseStudyView({ project }) {
  const { theme } = useAppTheme();

  /* The pageview already records the path; this counts case-study engagement
     as its own conversion so it can be compared against contact and resume.
     The ref guards against firing twice for one slug: React StrictMode
     double-invokes effects in dev, and dev writes to the same Supabase as
     production, so without this every local visit inflates the real count. */
  const trackedSlug = useRef(null);
  useEffect(() => {
    const slug = project?.slug;
    if (!slug || trackedSlug.current === slug) return;
    trackedSlug.current = slug;
    track("case_study_view", { meta: { slug } });
  }, [project?.slug]);

  const {
    name,
    tagline,
    role,
    timeframe,
    problem,
    approach,
    outcome,
    highlights = [],
    stack_line,
    languages = [],
    repo_url,
    live_url,
    url,
  } = project;

  const repo = repo_url || url;
  const meta = [role, timeframe].filter(Boolean).join(" · ");

  return (
    <div className="cs-main">
      <Header />

      <article className="cs-body">
        <Link href="/projects" className="cs-back" style={{ color: theme.accentColor }}>
          ← All projects
        </Link>

        <header className="cs-header">
          <h1 className="cs-title" style={{ color: theme.text }}>
            {name}
          </h1>
          {tagline && (
            <p className="cs-tagline" style={{ color: theme.secondaryText }}>
              {tagline}
            </p>
          )}
          {meta && (
            <p className="cs-meta" style={{ color: theme.secondaryText }}>
              {meta}
            </p>
          )}

          {(live_url || repo) && (
            <div className="cs-links">
              {live_url && (
                <a
                  className="cs-link-btn"
                  href={live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: theme.accentBright }}
                >
                  View live
                </a>
              )}
              {repo && (
                <a
                  className="cs-link-btn cs-link-ghost"
                  href={repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ borderColor: theme.accentColor, color: theme.accentColor }}
                >
                  Source code
                </a>
              )}
            </div>
          )}
        </header>

        {highlights.length > 0 && (
          <div className="cs-highlights">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="cs-highlight"
                style={{ backgroundColor: theme.projectCard, color: theme.text }}
              >
                {h}
              </div>
            ))}
          </div>
        )}

        <Section title="The problem" body={problem} theme={theme} />
        <Section title="What I built" body={approach} theme={theme} />
        <Section title="Outcome" body={outcome} theme={theme} />

        {(stack_line || languages.length > 0) && (
          <section className="cs-section">
            <h2 className="cs-section-title" style={{ color: theme.text }}>
              Stack
            </h2>
            {stack_line && (
              <p className="cs-text" style={{ color: theme.secondaryText }}>
                {stack_line}
              </p>
            )}
            {languages.length > 0 && (
              <div className="cs-langs">
                <ProjectLanguages logos={languages} />
              </div>
            )}
          </section>
        )}

        <div className="cs-footer-nav">
          <Link href="/projects" className="cs-back" style={{ color: theme.accentColor }}>
            ← All projects
          </Link>
          <Link href="/contact" className="cs-back" style={{ color: theme.accentColor }}>
            Get in touch →
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
}

function Section({ title, body, theme }) {
  if (!body) return null;
  return (
    <section className="cs-section">
      <h2 className="cs-section-title" style={{ color: theme.text }}>
        {title}
      </h2>
      {body.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className="cs-text" style={{ color: theme.secondaryText }}>
          {para}
        </p>
      ))}
    </section>
  );
}
