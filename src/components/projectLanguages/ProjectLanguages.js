"use client";
import React from "react";
import AppIcon from "../icon/AppIcon";
import "./ProjectLanguages.css";

function ProjectLanguages(props) {
  return (
    <div className="software-skills-main-div">
      <ul className="dev-icons-languages">
        {props.logos.map((logo) => (
          <li key={logo.name} className="software-skill-inline-languages" title={logo.name}>
            <AppIcon name={logo.iconifyClass} label={logo.name} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectLanguages;
