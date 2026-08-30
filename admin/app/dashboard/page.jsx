"use client";
import Link from "next/link";

const sections = [
  { href: "/dashboard/greeting", title: "Greeting & Bio", desc: "Your name, subtitle, resume link, social links" },
  { href: "/dashboard/skills", title: "Skills", desc: "Skill categories and software skill icons" },
  { href: "/dashboard/experience", title: "Experience", desc: "Work experience and volunteerships" },
  { href: "/dashboard/education", title: "Education", desc: "Degrees and certifications" },
  { href: "/dashboard/certifications", title: "Certifications", desc: "Course certificates" },
  { href: "/dashboard/projects", title: "Projects", desc: "Project cards with languages" },
  { href: "/dashboard/contact", title: "Contact", desc: "Contact section and blog link" },
  { href: "/dashboard/settings", title: "Settings", desc: "Splash screen, tracking ID" },
];

export default function DashboardOverview() {
  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <a href="https://sumitgautam.tech" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, color: "var(--muted)" }}>
          View live site ↗
        </a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {sections.map((s) => (
          <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
