"use client";
import React from "react";
import AppIcon from "../icon/AppIcon";
import "./SoftwareSkill.css";

function SoftwareSkill(props) {
  return (
    <div className="software-skills-main-div">
      <ul className="dev-icons">
        {props.logos.map((logo, i) => (
          <li key={`${logo.skillName}-${i}`} className="software-skill-inline" title={logo.skillName}>
            <AppIcon
              name={logo.fontAwesomeClassname}
              style={logo.style}
              label={logo.skillName}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SoftwareSkill;
