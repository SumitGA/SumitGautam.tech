"use client";
import React from "react";
import ProjectLanguages from "../projectLanguages/ProjectLanguages";
import "./ProjectCard.css";

export default function ProjectCard({ repo, theme }) {
  function openRepoinNewTab(url) {
    window.open(url, "_blank");
  }

  return (
    <div className="fade-in-up">
      <div
        className="project-card"
        key={repo.id}
        onClick={() => openRepoinNewTab(repo.url)}
        style={{ backgroundColor: theme.projectCard }}
      >
        <div className="repo-name-div">
          <p className="repo-name" style={{ color: theme.text }}>{repo.name}</p>
        </div>
        <p className="repo-description" style={{ color: theme.text }}>{repo.description}</p>
        <div className="repo-details">
          <ProjectLanguages logos={repo.languages} />
        </div>
      </div>
    </div>
  );
}
