"use client";
import React from "react";
import "./SocialMedia.css";
import { useSiteData } from "../../../app/providers";
import { track } from "../../../lib/analytics-client";

export default function SocialMedia() {
  const { socialMediaLinks } = useSiteData() || {};
  if (!socialMediaLinks) return null;

  /* Delegated rather than an onClick per anchor — there are seven, and the
     network name is already on the element as a class. */
  function handleClick(e) {
    const link = e.target.closest("a.icon-button");
    if (!link) return;
    const network = [...link.classList].find((c) => c !== "icon-button");
    track("outbound_click", { meta: { target: network || "social" } });
  }

  return (
    <div className="social-media-div" onClick={handleClick}>
      {socialMediaLinks.github && (
        <a href={socialMediaLinks.github} className="icon-button github" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">
          <i className="fab fa-github" aria-hidden="true"></i><span aria-hidden="true"></span>
        </a>
      )}
      {socialMediaLinks.linkedin && (
        <a href={socialMediaLinks.linkedin} className="icon-button linkedin" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile">
          <i className="fab fa-linkedin-in" aria-hidden="true"></i><span aria-hidden="true"></span>
        </a>
      )}
      {socialMediaLinks.gmail && (
        <a href={`mailto:${socialMediaLinks.gmail}`} className="icon-button google" target="_blank" rel="noopener noreferrer" aria-label="Email Sumit">
          <i className="fab fa-google" aria-hidden="true"></i><span aria-hidden="true"></span>
        </a>
      )}
      {socialMediaLinks.twitter && (
        <a href={socialMediaLinks.twitter} className="icon-button twitter" target="_blank" rel="noopener noreferrer" aria-label="Twitter profile">
          <i className="fab fa-twitter" aria-hidden="true"></i><span aria-hidden="true"></span>
        </a>
      )}
      {socialMediaLinks.instagram && (
        <a href={socialMediaLinks.instagram} className="icon-button instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram profile">
          <i className="fab fa-instagram" aria-hidden="true"></i><span aria-hidden="true"></span>
        </a>
      )}
      {socialMediaLinks.bitbucket && (
        <a href={socialMediaLinks.bitbucket} className="icon-button bitbucket" target="_blank" rel="noopener noreferrer" aria-label="Bitbucket profile">
          <i className="fab fa-bitbucket" aria-hidden="true"></i><span aria-hidden="true"></span>
        </a>
      )}
      {socialMediaLinks.facebook && (
        <a href={socialMediaLinks.facebook} className="icon-button facebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook profile">
          <i className="fab fa-facebook-f" aria-hidden="true"></i><span aria-hidden="true"></span>
        </a>
      )}
    </div>
  );
}
