import React, { useState } from "react";
import "./Project.css";
import ProjectCard from "../../components/ProjectCard/";

export default function Projects() {
  const [repo, _] = useState([]);

  return (
    <div className="main" id="opensource">
      <h2 className="project-title">Open Source Projects</h2>
      <div className="repo-cards-div-main">
        {repo.map((v, i) => {
          return <ProjectCard repo={v} key={v.node.id} />;
        })}
      </div>
      <a className="resume-btn" href="https://github.com/harikanani">
        More Projects (Github)
      </a>
    </div>
  );
}
