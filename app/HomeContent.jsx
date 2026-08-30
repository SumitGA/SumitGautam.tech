"use client";
import Header from "../src/components/header/Header";
import Greeting from "../src/containers/greeting/Greeting";
import Skills from "../src/containers/skills/Skills";
import Footer from "../src/components/footer/Footer";
import ChatWidget from "../src/components/chatWidget/ChatWidget";
import { useAppTheme } from "./providers";

export default function HomeContent() {
  const { theme } = useAppTheme();
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
