"use client";
import { useState, useEffect } from "react";
import { settings } from "../src/portfolio";

export default function SplashOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!settings.isSplash) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#1D1D1D",
    }}>
      <div style={{ position: "relative", width: 90, height: 120 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="ball" />
        ))}
      </div>
    </div>
  );
}
