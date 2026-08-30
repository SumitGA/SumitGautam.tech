"use client";
import React from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import ExperienceAccordion from "../../containers/experienceAccordion/ExperienceAccordion.js";
import "./Experience.css";
import ExperienceImg from "./ExperienceImg";
import { useAppTheme } from "../../../app/providers";
import { useSiteData } from "../../../app/providers";

export default function Experience() {
  const { theme } = useAppTheme();
  const { experience } = useSiteData() || {};

  if (!experience) return null;

  return (
    <div className="experience-main">
      <Header />
      <div className="basic-experience">
        <div className="experience-heading-div fade-in-up">
          <div className="experience-heading-img-div">
            <ExperienceImg theme={theme} />
          </div>
          <div className="experience-heading-text-div">
            <h1 className="experience-heading-text" style={{ color: theme.text }}>
              {experience.title}
            </h1>
            <h3 className="experience-heading-sub-text" style={{ color: theme.text }}>
              {experience.subtitle}
            </h3>
            <p className="experience-header-detail-text subTitle" style={{ color: theme.secondaryText }}>
              {experience.description}
            </p>
          </div>
        </div>
      </div>
      <ExperienceAccordion sections={experience.sections} theme={theme} />
      <Footer />
    </div>
  );
}
