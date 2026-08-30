#!/usr/bin/env bash
# Phase 1 quick fixes for SumitGautam.tech (CRA app)
# Run from the repo root. Creates a branch, patches, and leaves changes staged.
set -euo pipefail

test -f package.json || { echo "Run this from the repo root."; exit 1; }

git checkout -b fix/seo-metadata

# --- 1. Rewrite index.html head with correct meta tags -------------------
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <title>Sumit Gautam | Senior Full Stack Engineer, Perth</title>
    <meta
      name="description"
      content="Sumit Gautam is a full stack engineer in Perth, Western Australia, working with Python, TypeScript, React, Rust and Kubernetes. Projects, experience and contact."
    />
    <link rel="canonical" href="https://sumitgautam.tech/" />

    <meta property="og:site_name" content="Sumit Gautam" />
    <meta property="og:title" content="Sumit Gautam | Senior Full Stack Engineer" />
    <meta
      property="og:description"
      content="Full stack engineer in Perth. Python, TypeScript, React, Rust, Kubernetes."
    />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="https://sumitgautam.tech/" />
    <meta property="og:image" content="https://sumitgautam.tech/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Sumit Gautam | Senior Full Stack Engineer" />
    <meta
      name="twitter:description"
      content="Full stack engineer in Perth. Python, TypeScript, React, Rust, Kubernetes."
    />
    <meta name="twitter:image" content="https://sumitgautam.tech/og-image.png" />

    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="%PUBLIC_URL%/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="%PUBLIC_URL%/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/apple-touch-icon.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <meta name="theme-color" content="#000000" />

    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
    />
    <script defer src="https://code.iconify.design/1/1.0.4/iconify.min.js"></script>
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/animejs/2.0.2/anime.js"></script>

    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Sumit Gautam",
        "url": "https://sumitgautam.tech/",
        "jobTitle": "Senior Full Stack Engineer",
        "address": {
          "@type": "PostalPlace",
          "addressLocality": "Perth",
          "addressRegion": "WA",
          "addressCountry": "AU"
        },
        "sameAs": [
          "https://github.com/SumitGA",
          "https://www.linkedin.com/in/sumit-gautam-202b07a5/"
        ]
      }
    </script>
  </head>
  <body>
    <noscript>
      Sumit Gautam, Senior Full Stack Engineer based in Perth, Western Australia.
      Contact: sghost33@gmail.com. GitHub: github.com/SumitGA
    </noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# --- 2. robots.txt with a sitemap reference -----------------------------
cat > public/robots.txt << 'EOF'
User-agent: *
Allow: /

Sitemap: https://sumitgautam.tech/sitemap.xml
EOF

# --- 3. sitemap.xml (homepage only until routing is fixed) --------------
cat > public/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sumitgautam.tech/</loc>
    <lastmod>$(date +%F)</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
EOF

# --- 4. Fix manifest.json (was name "App", all icons 404) ---------------
cat > public/manifest.json << 'EOF'
{
  "name": "Sumit Gautam | Senior Full Stack Engineer",
  "short_name": "Sumit Gautam",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
EOF

# --- 5. Remove dead/orphan files ----------------------------------------
git rm -q --ignore-unmatch public/favicon1.ico public/site.webmanifest public/browserconfig.xml

# --- 6. Drop the junk "fs" dependency -----------------------------------
npm pkg delete dependencies.fs

echo
echo "Done. Review with:  git diff --cached; git status"
echo "Then:               npm run build && npm run deploy"
