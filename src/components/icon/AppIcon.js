"use client";
import React from "react";
import { Icon } from "@iconify/react";
import { normalizeIconName } from "./icon-name.mjs";
import "./AppIcon.css";

export default function AppIcon({ name, style, label }) {
  const icon = normalizeIconName(name);
  if (!icon) return null;

  return (
    <Icon
      icon={icon}
      style={style}
      role="img"
      aria-label={label || undefined}
      aria-hidden={label ? undefined : "true"}
      /* Without a fallback an unresolved icon collapses to a zero-width span:
         the row reflows as each icon arrives, and a name that never resolves
         leaves no trace at all — which is how the broken Java and NodeJS
         names went unnoticed. This holds the space and stays visible. */
      fallback={<span className="app-icon-fallback" aria-hidden="true" />}
    />
  );
}
