# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm start          # Dev server (uses NODE_OPTIONS=--openssl-legacy-provider internally)
npm run build      # Production build
npm test           # Run tests
npm run deploy     # Build + push to gh-pages branch (deploys to sumitgautam.tech)
```

To run a single test file:
```bash
npx react-scripts test --testPathPattern="<filename>" --watchAll=false
```

Prettier runs automatically on commit via husky + lint-staged (formats `*.js`, `*.css`, `*.md`, `*.json`).

## Architecture

This is a React 16 single-page portfolio site deployed to GitHub Pages via `gh-pages`.

**Data flow:** All portfolio content lives in `src/portfolio.js` as plain JS objects (`greeting`, `skills`, `degrees`, `certifications`, `experience`, `projects`, `contactPageData`). Pages import directly from this file — there is no API or CMS.

**Theming:** `src/theme.js` exports two theme objects (`light`, `dark`). `App.js` reads the user's preferred theme from `localStorage`, passes the active theme object down through props to every page and component. `styled-components` `ThemeProvider` wraps the tree so components can also access it via the theme prop.

**Routing:** `src/containers/Main.js` owns all routes using `react-router-dom v5` with `HashRouter`. Routes: `/` (splash or home depending on `settings.isSplash`), `/home`, `/experience`, `/education`, `/contact`, `/projects`, `/splash`.

**Page/component split:**
- `src/pages/` — full-page route components (home, splash, education, experience, contact, projects)
- `src/components/` — reusable UI pieces (header, footer, cards, social media links, chatWidget, etc.)
- `src/containers/Main.js` — sole router/layout container

**Customization entry points:**
- `src/portfolio.js` — all personal content (bio, jobs, projects, certs, social links)
- `src/theme.js` — color tokens for light/dark themes
- `package.json` `homepage` field — must match the deployment domain

**Icons:** Uses `@iconify/react` for project language icons (`iconifyClass` field in `portfolio.js`) and Font Awesome class names (`fontAwesomeClassname`) for skill icons.

**Deployment:** `npm run deploy` runs `gh-pages -d build`, pushing the build output to the `gh-pages` branch. The `CNAME` file in `public/` sets the custom domain.
