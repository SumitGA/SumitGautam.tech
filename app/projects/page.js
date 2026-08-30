import Projects from "../../src/views/projects/Projects";

export const metadata = {
  title: "Projects",
  description: "Open-source projects by Sumit Gautam: NFT Marketplace, VideoChat, Espider, ChatAPI, Ticketing Service and more built with React, Node.js, Rust and Kubernetes.",
  alternates: { canonical: "/projects" },
  openGraph: { url: "/projects" },
};

export default function ProjectsPage() {
  return <Projects />;
}
