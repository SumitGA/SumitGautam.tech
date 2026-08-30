"use client";
import React, { useState } from "react";
import ExperienceCard from "../../components/experienceCard/ExperienceCard.js";
import "./ExperienceAccordion.css";

function ExperienceAccordion(props) {
  const theme = props.theme;
  const [open, setOpen] = useState({});

  const toggle = (title) =>
    setOpen((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <div className="experience-accord">
      {props.sections.map((section) => (
        <div key={section.title} className="accord-section">
          <button
            className="accord-header"
            onClick={() => toggle(section.title)}
            style={{
              backgroundColor: theme.imageDark,
              color: theme.text,
              borderBottom: `1px solid ${theme.accentColor}`,
            }}
          >
            <span>{section.title}</span>
            <span className="accord-chevron">{open[section.title] ? "▲" : "▼"}</span>
          </button>
          {open[section.title] && (
            <div className="accord-body">
              {section.experiences.map((experience) => (
                <ExperienceCard
                  key={experience.title + experience.company}
                  experience={experience}
                  theme={theme}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ExperienceAccordion;
