"use client";
import Header from "../src/components/header/Header";
import Greeting from "../src/containers/greeting/Greeting";
import Skills from "../src/containers/skills/Skills";
import Footer from "../src/components/footer/Footer";
import ChatWidget from "../src/components/chatWidget/ChatWidget";
import LatestPosts from "./LatestPosts";
import { useAppTheme } from "./providers";

export default function HomeContent({ posts = [] }) {
  const { theme } = useAppTheme();
  return (
    <div>
      <Header />
      <Greeting />
      <Skills theme={theme} />
      <LatestPosts posts={posts} />
      <Footer />
      <ChatWidget theme={theme} />
    </div>
  );
}
