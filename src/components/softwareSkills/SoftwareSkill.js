"use client";
import React from "react";
import "./SoftwareSkill.css";

function SoftwareSkill(props) {
  return (
    <div className="software-skills-main-div">
      <ul className="dev-icons">
        {props.logos.map((logo) => (
          <li key={logo.skillName} className="software-skill-inline" title={logo.skillName}>
            <span
              className="iconify"
              data-icon={logo.fontAwesomeClassname}
              style={logo.style}
              data-inline="false"
            ></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SoftwareSkill;
