"use client";
import React from "react";
import "./Skills.css";
import SoftwareSkill from "../../components/softwareSkills/SoftwareSkill";
import { skills } from "../../portfolio";
import FullStackImg from "./FullStackImg";
import CloudInfraImg from "./CloudInfraImg";

function GetSkillSvg(props) {
  if (props.fileName === "FullStackImg") return <FullStackImg theme={props.theme} />;
  if (props.fileName === "CloudInfraImg") return <CloudInfraImg theme={props.theme} />;
  return null;
}

function SkillSection(props) {
  const theme = props.theme;
  return (
    <div>
      {skills.data.map((skill, index) => {
        const isEven = index % 2 === 0;
        return (
          <div key={skill.title} className="skills-main-div">
            {isEven ? (
              <>
                <div className="skills-image-div fade-in-left">
                  <GetSkillSvg fileName={skill.fileName} theme={theme} />
                </div>
                <div className="skills-text-div fade-in-right">
                  <h1 className="skills-heading" style={{ color: theme.text }}>{skill.title}</h1>
                  <SoftwareSkill logos={skill.softwareSkills} />
                  <div>
                    {skill.skills.map((s) => (
                      <p key={s} className="subTitle skills-text" style={{ color: theme.secondaryText }}>{s}</p>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="skills-text-div fade-in-left">
                  <h1 className="skills-heading" style={{ color: theme.text }}>{skill.title}</h1>
                  <SoftwareSkill logos={skill.softwareSkills} />
                  <div>
                    {skill.skills.map((s) => (
                      <p key={s} className="subTitle skills-text" style={{ color: theme.secondaryText }}>{s}</p>
                    ))}
                  </div>
                </div>
                <div className="skills-image-div fade-in-right">
                  <GetSkillSvg fileName={skill.fileName} theme={theme} />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SkillSection;
