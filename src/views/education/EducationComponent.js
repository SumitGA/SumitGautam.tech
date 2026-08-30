"use client";
import React from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import Educations from "../../containers/education/Educations";
import Certifications from "../../containers/certifications/Certifications";
import EducationImg from "./EducationImg";
import "./EducationComponent.css";
import { useAppTheme } from "../../../app/providers";

function Education() {
  const { theme } = useAppTheme();
  return (
    <div className="education-main">
      <Header />
      <div className="basic-education">
        <div className="heading-div fade-in-up">
          <div className="heading-img-div">
            <EducationImg theme={theme} />
          </div>
          <div className="heading-text-div">
            <h1 className="heading-text" style={{ color: theme.text }}>Education</h1>
            <h3 className="heading-sub-text" style={{ color: theme.text }}>
              Basic Qualification and Certifications
            </h3>
            <p className="experience-header-detail-text subTitle" style={{ color: theme.secondaryText }}>
              I actively participate in hackathons and other tech-related activities. Below are some of my major certifications.
            </p>
          </div>
        </div>
        <Educations theme={theme} />
        <Certifications theme={theme} />
      </div>
      <Footer />
    </div>
  );
}

export default Education;
