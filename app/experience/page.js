import Experience from "../../src/views/experience/Experience";

export const metadata = {
  title: "Experience",
  description: "Sumit Gautam's professional experience as a full stack engineer across Australia, including Intersect, EZY RAISE, and Whitehat Engineering.",
  alternates: { canonical: "/experience" },
  openGraph: { url: "/experience" },
};

export default function ExperiencePage() {
  return <Experience />;
}
