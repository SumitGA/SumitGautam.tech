import Contact from "../../src/views/contact/ContactComponent";

export const metadata = {
  title: "Contact",
  description: "Get in touch with Sumit Gautam — full stack engineer based in Perth, WA. Links to GitHub, LinkedIn, email and resume.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact" },
};

export default function ContactPage() {
  return <Contact />;
}
