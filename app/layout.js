import { site } from "../lib/site";
import { getAllSiteData } from "../lib/portfolio-data";
import { Providers } from "./providers";
import StyledComponentsRegistry from "./styled-registry";
import AnalyticsTracker from "./AnalyticsTracker";
import "./globals.css";

/* Content comes from a CMS and changes rarely, so rendering every page on
   every request was pure waste: each visitor triggered a serverless function
   and roughly ten Supabase queries before receiving a byte, and every response
   missed the CDN cache (~1.1s TTFB measured).

   Revalidating instead means pages are served from the edge and the database
   is touched at most once a minute per page. An admin edit takes up to a
   minute to appear, which is the trade. */
export const revalidate = 60;

export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  /* No canonical here on purpose. A default of "/" is inherited by every page
     that does not override it, which told Google that /resume and every case
     study were duplicates of the homepage. Each route declares its own; a page
     that forgets now emits none, which Google infers from the URL, rather than
     one that actively points somewhere wrong. */
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
