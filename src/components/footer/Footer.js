"use client";
import React from "react";
import "./Footer.css";
import { greeting as staticGreeting } from "../../portfolio.js";
import { useAppTheme, useSiteData } from "../../../app/providers";

export default function Footer() {
  const { theme } = useAppTheme();
  // Prefer the CMS-managed name so editing it in the admin updates the footer
  // too; fall back to the static copy when site data isn't available.
  const { greeting } = useSiteData() || {};
  const name = greeting?.title2 || staticGreeting.title2;

  return (
    <div className="footer-div fade-in">
      <p className="footer-text" style={{ color: theme.secondaryText }}>
        Made with{" "}
        <span className="footer-heart" role="img" aria-label="love">
          ❤️
        </span>{" "}
        by{" "}
        <span className="footer-name" style={{ color: theme.text }}>
          {name}
        </span>
      </p>
    </div>
  );
}
