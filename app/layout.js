import { site } from "../lib/site";
import { getAllSiteData } from "../lib/portfolio-data";
import { Providers } from "./providers";
import StyledComponentsRegistry from "./styled-registry";
import AnalyticsTracker from "./AnalyticsTracker";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: "/",
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/android-chrome-512x512.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: "#000000" };

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: "Senior Full Stack Engineer",
  email: `mailto:${site.email}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.locality,
    addressRegion: site.region,
    addressCountry: site.country,
  },
  sameAs: [site.github, site.linkedin],
};

export default async function RootLayout({ children }) {
  const siteData = await getAllSiteData();

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </head>
      <body>
        <StyledComponentsRegistry>
          <Providers siteData={siteData}>{children}</Providers>
        </StyledComponentsRegistry>
        <AnalyticsTracker />
      </body>
    </html>
  );
}
