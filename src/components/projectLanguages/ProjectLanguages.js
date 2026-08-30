"use client";
import React from "react";
import "./ProjectLanguages.css";

function ProjectLanguages(props) {
  return (
    <div className="software-skills-main-div">
      <ul className="dev-icons-languages">
        {props.logos.map((logo) => (
          <li key={logo.name} className="software-skill-inline-languages" title={logo.name}>
            <span className="iconify" data-icon={logo.iconifyClass} data-inline="false"></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectLanguages;
