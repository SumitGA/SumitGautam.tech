"use client";
import React from "react";
import "./Skills.css";
import SoftwareSkill from "../../components/softwareSkills/SoftwareSkill";
import { useSiteData } from "../../../app/providers";
import FullStackImg from "./FullStackImg";
import CloudInfraImg from "./CloudInfraImg";

function GetSkillSvg({ fileName, theme }) {
  if (fileName === "FullStackImg") return <FullStackImg theme={theme} />;
  if (fileName === "CloudInfraImg") return <CloudInfraImg theme={theme} />;
  return null;
}

export default function SkillSection({ theme }) {
  const { skills } = useSiteData() || {};
  if (!skills) return null;

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
