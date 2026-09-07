"use client";
import React from "react";
import "./Skills.css";
import SkillSection from "./SkillSection";

export default function Skills(props) {
  const theme = props.theme;
  return (
    <div className="main" id="skills">
      <div className="skills-header-div">
        <h2 className="skills-header fade-in-up" style={{ color: theme.text }}>
          Here&apos;s what I do
        </h2>
      </div>
      <SkillSection theme={theme} />
    </div>
  );
}
