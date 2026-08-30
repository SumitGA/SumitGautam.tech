"use client";
import React from "react";
import "./Footer.css";
import { greeting } from "../../portfolio.js";
import { useAppTheme } from "../../../app/providers";

export default function Footer() {
  const { theme } = useAppTheme();
  return (
    <div className="footer-div fade-in">
      <p className="footer-text" style={{ color: theme.secondaryText }}>
        Made with <span role="img" aria-label="heart">❤️</span> by {greeting.title2}
      </p>
    </div>
  );
}
