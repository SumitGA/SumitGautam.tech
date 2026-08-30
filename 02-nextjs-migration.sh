#!/usr/bin/env bash
# Phase 2: scaffold the Next.js App Router replacement for SumitGautam.tech
#
# This builds the SHELL: config, routing, per-page metadata, sitemap, robots,
# JSON-LD, and CI/CD. It does NOT auto-port your React components - that part
# is manual and is listed at the end.
#
# Run from the repo root, AFTER 01-quickfix.sh has been merged.
set -euo pipefail

test -f package.json || { echo "Run this from the repo root."; exit 1; }

git checkout main
git pull
git checkout -b feat/nextjs

# ---------------------------------------------------------------------------
# 1. Strip the CRA toolchain and the dead/duplicate dependencies
# ---------------------------------------------------------------------------
npm pkg delete \
  dependencies.fs \
  dependencies.fbjs \
  dependencies.glamor \
  dependencies.node-fetch \
  dependencies.node-sass \
  dependencies.serve \
  dependencies.prettier-package-json \
  dependencies.react-scripts \
  dependencies.react-ga \
  dependencies.react-reveal \
  dependencies.react-router-dom \
  dependencies.bootstrap \
  dependencies.react-bootstrap \
  dependencies.baseui \
  dependencies.styletron-engine-atomic \
  dependencies.styletron-react \
  dependencies.react-is \
  dependencies.react-cursor-custom \
  dependencies.react-rounded-image \
  devDependencies.gh-pages \
  devDependencies.husky

rm -rf node_modules package-lock.json

# 19MB of icons you already load from a CDN
git rm -rq --ignore-unmatch src/assests/font-awesome

# ---------------------------------------------------------------------------
# 2. Install Next.js
# ---------------------------------------------------------------------------
npm install next@latest react@latest react-dom@latest --no-audit --no-fund
npm install -D sass eslint eslint-config-next --no-audit --no-fund

npm pkg set scripts.dev="next dev"
npm pkg set scripts.build="next build"
npm pkg set scripts.start="next start"
npm pkg set scripts.lint="next lint"
npm pkg delete scripts.predeploy scripts.deploy scripts.eject scripts.test

# ---------------------------------------------------------------------------
# 3. Config - static export, so it still works on GitHub Pages
# ---------------------------------------------------------------------------
cat > next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
EOF

# ---------------------------------------------------------------------------
# 4. Central site config - single source of truth for metadata
# ---------------------------------------------------------------------------
mkdir -p lib app/projects app/experience app/education app/contact app/blog

cat > lib/site.js << 'EOF'
export const site = {
  url: "https://sumitgautam.tech",
  name: "Sumit Gautam",
  title: "Sumit Gautam | Senior Full Stack Engineer",
  description:
    "Full stack engineer in Perth, Western Australia. Python, TypeScript, React, Rust, Kubernetes and distributed systems.",
  locality: "Perth",
  region: "WA",
  country: "AU",
  email: "sghost33@gmail.com",
  github: "https://github.com/SumitGA",
  linkedin: "https://www.linkedin.com/in/sumit-gautam-202b07a5/",
};

// Every route that should exist as a real, crawlable URL.
export const routes = [
  { path: "/", title: "Sumit Gautam | Senior Full Stack Engineer", priority: 1.0 },
  { path: "/projects", title: "Projects", priority: 0.9 },
  { path: "/experience", title: "Experience", priority: 0.8 },
  { path: "/education", title: "Education", priority: 0.5 },
  { path: "/contact", title: "Contact", priority: 0.5 },
  { path: "/blog", title: "Writing", priority: 0.9 },
];
EOF

# ---------------------------------------------------------------------------
# 5. Root layout - default metadata + Person JSON-LD
# ---------------------------------------------------------------------------
cat > app/layout.js << 'EOF'
import { site } from "../lib/site";
import "./globals.css";

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
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
EOF

cat > app/globals.css << 'EOF'
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
EOF

# ---------------------------------------------------------------------------
# 6. Routes - each is a real URL with its own metadata and its own canonical
# ---------------------------------------------------------------------------
cat > app/page.js << 'EOF'
export default function Home() {
  return (
    <main>
      <h1>Sumit Gautam</h1>
      <p>Senior Full Stack Engineer, Perth WA.</p>
      {/* TODO: port src/pages/home/HomeComponent.js here */}
    </main>
  );
}
EOF

for r in projects experience education contact blog; do
  # capitalise for the heading
  T="$(echo "${r:0:1}" | tr '[:lower:]' '[:upper:]')${r:1}"
  cat > "app/$r/page.js" << EOF
export const metadata = {
  title: "$T",
  description: "TODO: write a real 150-character description for this page.",
  alternates: { canonical: "/$r" },
  openGraph: { url: "/$r" },
};

export default function ${T}Page() {
  return (
    <main>
      <h1>$T</h1>
      {/* TODO: port src/pages/$r/ here */}
    </main>
  );
}
EOF
done

# ---------------------------------------------------------------------------
# 7. Generated sitemap.xml and robots.txt
# ---------------------------------------------------------------------------
cat > app/sitemap.js << 'EOF'
import { site, routes } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap() {
  return routes.map((r) => ({
    url: `${site.url}${r.path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: r.priority,
  }));
}
EOF

cat > app/robots.js << 'EOF'
import { site } from "../lib/site";

export const dynamic = "force-static";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
EOF

# Static robots.txt/sitemap.xml from phase 1 would collide with the generated ones
git rm -q --ignore-unmatch public/robots.txt public/sitemap.xml public/index.html
echo "sumitgautam.tech" > public/CNAME

# ---------------------------------------------------------------------------
# 8. Replace the dead Node 12 CI with a real build-and-deploy pipeline
# ---------------------------------------------------------------------------
git rm -q --ignore-unmatch .github/workflows/node.js.yml
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
name: Build and Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
EOF

cat >> .gitignore << 'EOF'

# Next.js
.next/
out/
EOF

# ---------------------------------------------------------------------------
# 9. Verify
# ---------------------------------------------------------------------------
npm run build

echo
echo "=================================================================="
echo "Build output is in ./out - every route is now a real HTML file:"
ls -1 out
echo
echo "Check that the crawlable content is actually there:"
echo "  grep -o '<h1>.*</h1>' out/projects/index.html"
echo
echo "STILL MANUAL:"
echo "  1. Port src/pages/* and src/containers/* into app/*/page.js."
echo "     Add \"use client\" at the top of any component using hooks,"
echo "     localStorage, or onClick."
echo "  2. Write real descriptions in each app/*/page.js metadata block."
echo "  3. Create public/og-image.png at 1200x630."
echo "  4. Replace react-reveal with CSS animations or framer-motion."
echo "  5. Pick ONE icon library (react-icons) and delete the rest."
echo "  6. GA: your UA-132872250-1 property is dead. Use Cloudflare Web"
echo "     Analytics or a GA4 property - do not reinstall react-ga."
echo "  7. Repo Settings > Pages > Source = GitHub Actions."
echo "  8. Delete src/ once the port is done."
echo "=================================================================="
