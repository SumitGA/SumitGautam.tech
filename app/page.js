"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../src/components/header/Header";
import Greeting from "../src/containers/greeting/Greeting";
import Skills from "../src/containers/skills/Skills";
import Footer from "../src/components/footer/Footer";
import ChatWidget from "../src/components/chatWidget/ChatWidget";
import { useAppTheme } from "./providers";
import { settings } from "../src/portfolio";

function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="logo_wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="loading">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="ball"></div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(settings.isSplash);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  return (
    <div>
      <Header />
      <Greeting />
      <Skills theme={theme} />
      <Footer />
      <ChatWidget theme={theme} />
    </div>
  );
}
