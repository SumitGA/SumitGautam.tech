"use client";
import React from "react";
import "./Educations.css";
import DegreeCard from "../../components/degreeCard/DegreeCard.js";
import { useSiteData } from "../../../app/providers";

export default function Educations({ theme }) {
  const { degrees } = useSiteData() || {};
  if (!degrees) return null;

  return (
    <div className="main" id="educations">
      <div className="educations-header-div">
        <h1 className="educations-header fade-in-up" style={{ color: theme.text }}>
          Degrees Received
        </h1>
      </div>
      <div className="educations-body-div">
        {degrees.degrees.map((degree) => (
          <DegreeCard key={degree.title} degree={degree} theme={theme} />
        ))}
      </div>
    </div>
  );
}
