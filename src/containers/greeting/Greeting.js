"use client";
import React from "react";
import "./Greeting.css";
import SocialMedia from "../../components/socialMedia/SocialMedia";
import { useRouter } from "next/navigation";
import FeelingProud from "./FeelingProud";
import { useAppTheme } from "../../../app/providers";
import { useSiteData } from "../../../app/providers";

export default function Greeting() {
  const { theme } = useAppTheme();
  const { greeting } = useSiteData() || {};
  const router = useRouter();

  if (!greeting) return null;

  return (
    <div className="greet-main fade-in-up" id="greeting">
      <div className="greeting-main">
        <div className="greeting-text-div">
          <div>
            <h1 className="greeting-text">{greeting.title}</h1>
            <p className="greeting-text-p subTitle" style={{ color: theme.secondaryText }}>
              <span>I&apos;m </span>
              <span style={{ color: theme.accentColor }}>{greeting.full_name}. </span>
              {greeting.subTitle}
            </p>
            <SocialMedia />
            <div className="portfolio-repo-btn-div">
              <button
                className="button"
                onClick={() => router.push("/contact")}
                style={{ backgroundColor: theme.accentBright }}
              >
                Contact Me
              </button>
            </div>
          </div>
        </div>
        <div className="greeting-image-div">
          <FeelingProud theme={theme} />
        </div>
      </div>
    </div>
  );
}
