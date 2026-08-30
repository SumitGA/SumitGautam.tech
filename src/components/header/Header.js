"use client";
import React, { useState } from "react";
import "./Header.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { greeting, settings } from "../../portfolio.js";
import { CgSun } from "react-icons/cg";
import { HiMoon } from "react-icons/hi";
import { useAppTheme } from "../../../app/providers";

function Header() {
  const { theme, setTheme } = useAppTheme();
  const pathname = usePathname();
  const [currTheme, setCurrTheme] = useState(theme.name);

  const link = settings.isSplash ? "/splash" : "/home";

  function changeTheme() {
    const next = currTheme === "light" ? "dark" : "light";
    setTheme(next);
    setCurrTheme(next);
  }

  const isActive = (href) =>
    pathname === href ? { fontWeight: "bold" } : {};

  const icon =
    theme.name === "dark" ? (
      <HiMoon strokeWidth={1} size={20} color="#A7A7A7" />
    ) : (
      <CgSun strokeWidth={1} size={20} color="#F9D784" />
    );

  const toggleBg = theme.name === "light" ? "#7CD1F7" : "#292C3F";

  return (
    <div className="fade-in">
      <header className="header">
        <Link href={link} className="logo">
          <span style={{ color: theme.text }}></span>
          <span className="logo-name" style={{ color: theme.text }}>
            {greeting.logo_name}
          </span>
          <span style={{ color: theme.text }}></span>
        </Link>
        <input className="menu-btn" type="checkbox" id="menu-btn" />
        <label className="menu-icon" htmlFor="menu-btn">
          <span className="navicon"></span>
        </label>
        <ul className="menu">
          <li>
            <Link href="/home" style={{ borderRadius: 5, color: theme.text, ...isActive("/home") }}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/education" style={{ borderRadius: 5, color: theme.text, ...isActive("/education") }}>
              Education and Certifications
            </Link>
          </li>
          <li>
            <Link href="/experience" style={{ borderRadius: 5, color: theme.text, ...isActive("/experience") }}>
              Experience
            </Link>
          </li>
          <li>
            <Link href="/projects" style={{ borderRadius: 5, color: theme.text, ...isActive("/projects") }}>
              Projects
            </Link>
          </li>
          <li>
            <Link href="/contact" style={{ borderRadius: 5, color: theme.text, ...isActive("/contact") }}>
              Contact and Resume
            </Link>
          </li>
          <button
            onClick={changeTheme}
            style={{
              cursor: "pointer",
              height: 45,
              width: 45,
              marginRight: 5,
              marginLeft: 15,
              paddingTop: 5,
              borderRadius: "50%",
              border: "none",
              backgroundColor: toggleBg,
              outline: "none",
              transition: "all 0.2s ease-in-out",
            }}
          >
            {icon}
          </button>
        </ul>
      </header>
    </div>
  );
}

export default Header;
