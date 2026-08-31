"use client";
import Header from "../../src/components/header/Header";
import Footer from "../../src/components/footer/Footer";
import "./resume.css";

export default function ResumeView({ data }) {
  if (!data) return null;

  const {
    header = {},
    summary = "",
    skills = [],
    jobs = [],
    education = [],
    certifications = "",
    references = "",
  } = data;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="resume-shell">
      {/* Site nav — hidden on print */}
      <div className="no-print">
        <Header />
      </div>

      {/* Everything below the header gets the light bg */}
      <div className="resume-content-area">

      {/* Download toolbar — hidden on print */}
      <div className="resume-toolbar no-print">
        <button className="resume-download-btn" onClick={handlePrint}>
          Download PDF
        </button>
      </div>

      {/* CV card — always white regardless of site theme */}
      <div className="resume-page">
        {/* ── Header ────────────────────────────────── */}
        <div className="rv-header">
          <h1 className="rv-name">{header.full_name || ""}</h1>
          <p className="rv-title">{header.title || ""}</p>
          <p className="rv-contact">
            {[header.phone, header.email, header.location, header.website]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {header.note && <p className="rv-note">{header.note}</p>}
        </div>

        {/* ── Professional Summary ──────────────────── */}
        {summary && (
          <section className="rv-section">
            <h2 className="rv-section-title">Professional Summary</h2>
            <div className="rv-rule" />
            <p className="rv-body-text">{summary}</p>
          </section>
        )}

        {/* ── Technical Skills ─────────────────────── */}
        {skills.length > 0 && (
          <section className="rv-section">
            <h2 className="rv-section-title">Technical Skills</h2>
            <div className="rv-rule" />
            <div className="rv-skills-list">
              {skills.map((s, i) => (
                <p key={i} className="rv-skill-row">
                  {s.category && (
                    <strong className="rv-skill-category">{s.category}:</strong>
                  )}{" "}
                  {s.skill_text}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* ── Experience ───────────────────────────── */}
        {jobs.length > 0 && (
          <section className="rv-section">
            <h2 className="rv-section-title">Experience</h2>
            <div className="rv-rule" />
            {jobs.map((job) => (
              <div key={job.id} className="rv-job">
                <div className="rv-job-top">
                  <span className="rv-job-title">{job.job_title}</span>
                  <span className="rv-job-date">{job.date_range}</span>
                </div>
                <p className="rv-job-company">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
                {job.company_description && (
                  <p className="rv-job-desc">{job.company_description}</p>
                )}
                {job.bullets.length > 0 && (
                  <ul className="rv-bullets">
                    {job.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {job.stack_line && (
                  <p className="rv-stack">
                    <strong>Stack:</strong> {job.stack_line}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── Education ────────────────────────────── */}
        {education.length > 0 && (
          <section className="rv-section">
            <h2 className="rv-section-title">Education</h2>
            <div className="rv-rule" />
            {education.map((entry) => (
              <div key={entry.id} className="rv-edu-row">
                <span className="rv-edu-degree">
                  {entry.degree} — {entry.institution}
                </span>
                {entry.graduated && (
                  <span className="rv-edu-year">{entry.graduated}</span>
                )}
              </div>
            ))}
            {certifications && (
              <p className="rv-cert-line">
                <strong>Certifications:</strong> {certifications}
              </p>
            )}
          </section>
        )}

        {/* ── References ───────────────────────────── */}
        {references && (
          <section className="rv-section">
            <h2 className="rv-section-title">References</h2>
            <div className="rv-rule" />
            <p className="rv-body-text rv-ref-text">{references}</p>
          </section>
        )}
      </div>

      {/* Site footer — hidden on print */}
      <div className="no-print">
        <Footer />
      </div>

      </div>{/* end resume-content-area */}
    </div>
  );
}
