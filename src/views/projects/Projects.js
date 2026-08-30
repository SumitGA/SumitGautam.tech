"use client";
import React from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import ProjectCard from "../../components/ProjectCard/ProjectCard";
import "./Projects.css";
import ProjectsImg from "./ProjectsImg";
import { useAppTheme } from "../../../app/providers";
import { useSiteData } from "../../../app/providers";

export default function Projects() {
  const { theme } = useAppTheme();
  const { projectsHeader, projects } = useSiteData() || {};

  if (!projects) return null;

  return (
    <div className="projects-main">
      <Header />
      <div className="basic-projects">
        <div className="projects-heading-div fade-in-up">
          <div className="projects-heading-img-div">
            <ProjectsImg theme={theme} />
          </div>
          <div className="projects-heading-text-div">
            <h1 className="projects-heading-text" style={{ color: theme.text }}>
              {projectsHeader?.title}
            </h1>
            <p className="projects-header-detail-text subTitle" style={{ color: theme.secondaryText }}>
              {projectsHeader?.description}
            </p>
          </div>
        </div>
      </div>
      <div className="repo-cards-div-main">
        {projects.data.map((repo) => (
          <ProjectCard key={repo.id + repo.name} repo={repo} theme={theme} />
        ))}
      </div>
      <br /><br /><br />
      <a
        className="general-btn"
        href="https://github.com/SumitGA"
        style={{ backgroundColor: theme.accentBright }}
      >
        More Projects (Github)
      </a>
      <br /><br />
      <Footer />
    </div>
  );
}
