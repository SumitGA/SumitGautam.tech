"use client";
import React from "react";
import Link from "next/link";
import ProjectLanguages from "../projectLanguages/ProjectLanguages";
import "./ProjectCard.css";

export default function ProjectCard({ repo, theme }) {
  const body = (
    <>
      <div className="repo-name-div">
        <p className="repo-name" style={{ color: theme.text }}>{repo.name}</p>
        {repo.hasCaseStudy && (
          <span className="repo-badge" style={{ backgroundColor: theme.accentColor }}>
            Case study
          </span>
        )}
      </div>
      <p className="repo-description" style={{ color: theme.text }}>
        {repo.tagline || repo.description}
      </p>
      <div className="repo-details">
        <ProjectLanguages logos={repo.languages} />
      </div>
    </>
  );

  // Projects with a written case study open the detail page; the rest keep the
  // old behaviour of linking straight out to the repo.
  if (repo.hasCaseStudy) {
    return (
      <div className="fade-in-up">
        <Link
          href={`/projects/${repo.slug}`}
          className="project-card project-card-link"
          style={{ backgroundColor: theme.projectCard }}
        >
          {body}
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div
        className="project-card"
        onClick={() => window.open(repo.url, "_blank")}
        style={{ backgroundColor: theme.projectCard }}
      >
        {body}
      </div>
    </div>
  );
}
