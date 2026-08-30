import Education from "../../src/views/education/EducationComponent";

export const metadata = {
  title: "Education",
  description: "Sumit Gautam's academic background: Masters of IT from Federation University and a Bachelor in CSIT from Tribhuvan University, plus Udemy certifications.",
  alternates: { canonical: "/education" },
  openGraph: { url: "/education" },
};

export default function EducationPage() {
  return <Education />;
}
