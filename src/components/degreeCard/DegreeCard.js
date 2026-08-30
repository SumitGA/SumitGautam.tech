"use client";
import React from "react";
import "./DegreeCard.css";

function DegreeCard(props) {
  const degree = props.degree;
  const theme = props.theme;

  return (
    <div className="degree-card">
      <div
        className="degree-img-wrapper fade-in-left"
        style={{ border: `1px solid ${theme.accentColor}`, boxShadow: `0px 0px 5px ${theme.accentColor}` }}
      >
        <img
          style={{ maxWidth: "100%", maxHeight: "100%" }}
          src={`/images/${degree.logo_path}`}
          alt={degree.alt_name}
        />
      </div>
      <div
        className="degree-card-body fade-in-right"
        style={{
          borderBottom: `1px solid ${theme.accentColor}`,
          borderLeft: `1px solid ${theme.accentColor}`,
          borderRight: `1px solid ${theme.accentColor}`,
          boxShadow: `0px 1px 5px ${theme.accentColor}`,
        }}
      >
        <div className="body-header" style={{ backgroundColor: theme.accentColor }}>
          <div className="body-header-title">
            <h2 className="card-title" style={{ color: "#FFFFFF" }}>{degree.title}</h2>
            <h3 className="card-subtitle" style={{ color: "#FFFFFF" }}>{degree.subtitle}</h3>
          </div>
          <div className="body-header-duration">
            <h3 className="duration" style={{ color: "#FFFFFF" }}>{degree.duration}</h3>
          </div>
        </div>
        <div className="body-content">
          {degree.descriptions.map((sentence, i) => (
            <p key={i} className="content-list" style={{ color: theme.text }}>{sentence}</p>
          ))}
          <a href={degree.website_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", textAlign: "center" }}>
            <p
              className="button-visit"
              style={{ marginRight: "23px", float: "right", backgroundColor: theme.accentColor }}
            >
              Visit Website
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default DegreeCard;
