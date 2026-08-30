"use client";
import React from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import SocialMedia from "../../components/socialMedia/SocialMedia";
import BlogsImg from "./BlogsImg";
import "./ContactComponent.css";
import { greeting, contactPageData } from "../../portfolio.js";
import { useAppTheme } from "../../../app/providers";

const ContactData = contactPageData.contactSection;
const blogSection = contactPageData.blogSection;

function Contact() {
  const { theme } = useAppTheme();
  return (
    <div className="contact-main">
      <Header />
      <div className="basic-contact">
        <div className="contact-heading-div fade-in-up">
          <div className="contact-heading-img-div">
            <img
              className="profile-pic"
              src={`/images/${ContactData.profile_image_path}`}
              alt="Profile"
            />
          </div>
          <div className="contact-heading-text-div">
            <h1 className="contact-heading-text" style={{ color: theme.text }}>
              {ContactData.title}
            </h1>
            <p className="contact-header-detail-text subTitle" style={{ color: theme.secondaryText }}>
              {ContactData.description}
            </p>
            <SocialMedia />
            <br /><br />
            <a
              className="general-btn"
              href={greeting.resumeLink}
              style={{ backgroundColor: theme.accentBright }}
            >
              See my Resume
            </a>
          </div>
        </div>
        <div className="blog-heading-div fade-in-up">
          <div className="blog-heading-text-div">
            <h1 className="blog-heading-text" style={{ color: theme.text }}>
              {blogSection.title}
            </h1>
            <p className="blog-header-detail-text subTitle" style={{ color: theme.secondaryText }}>
              {blogSection.subtitle}
            </p>
            <div className="blogsite-btn-div">
              <a
                className="general-btn"
                href={blogSection.link}
                style={{ backgroundColor: theme.accentBright }}
              >
                My Twitter Profile
              </a>
            </div>
          </div>
          <div className="blog-heading-img-div">
            <BlogsImg theme={theme} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Contact;
