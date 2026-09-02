# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Development server (http://localhost:3000)
npm run build      # Production build
npm run start      # Start production server locally
npm run lint       # Lint (currently a no-op)
```

Admin panel (separate Next.js 15 project in `admin/`):
```bash
cd admin && npm install
cd admin && npm run dev   # http://localhost:3001
```

## Architecture Overview

This is a **Next.js 16 App Router** portfolio site deployed to Vercel at `sumitgautam.tech`.

It was migrated from CRA + HashRouter. The old CRA-style files still exist under `src/` (pages, components, portfolio.js) but are imported by the Next.js app layer — not run as standalone React SPA.

### Directory layout

```
app/                   Next.js App Router pages and API routes
  layout.js            Root layout — fetches all site data server-side via getAllSiteData()
  page.js              Splash or home redirect (reads settings.isSplash)
  home/page.js
  experience/page.js
  education/page.js
  projects/page.js
  contact/page.js
  resume/              CV page
    page.js            Server component — calls getResumeData(), passes to ResumeView
    ResumeView.jsx     Client component — full CV layout
    resume.css         CV styles + print styles
  api/contact/
    route.js           POST handler — receives form data, sends email via Resend

src/
  portfolio.js         Static fallback content (used when Supabase is unavailable)
  theme.js             Light/dark theme colour tokens
  views/               Full-page view components (used by app/ page.js files)
  components/          Reusable UI components
    contactForm/
      ContactForm.jsx  Contact form component (name/email/subject/message)
      ContactForm.css

lib/
  portfolio-data.js    Server-side Supabase fetchers with static fallbacks
  supabase.js          Supabase client factory (server + browser singletons)

admin/                 Separate Next.js 15 project for the CMS admin panel
  app/dashboard/       Admin pages: greeting, skills, experience, resume, contact, settings
  lib/                 Admin-specific Supabase client

supabase/
  schema.sql           Portfolio DB schema + seed data
  resume_schema.sql    Resume DB schema + seed data
  resume_patch.sql     Idempotent RLS policy patch (safe to re-run)
```

### Data flow

1. `app/layout.js` calls `getAllSiteData()` (server-side) which fetches all portfolio tables from Supabase in parallel.
2. Data is stored in `SiteDataCtx` React context via `app/providers.js`.
3. Client components access it with `useSiteData()` — never fetch Supabase directly in client components (except admin panel).
4. Static fallbacks in `src/portfolio.js` and `lib/portfolio-data.js` ensure the site works without Supabase (local dev without env vars).

### Theming

`src/theme.js` exports `light` and `dark` theme objects. `useAppTheme()` from `app/providers.js` reads the active theme. `styled-components` `ThemeProvider` also wraps the tree.

### Routing

All routes live in `app/`. The old `src/containers/Main.js` router is no longer active.

## Environment Variables

### Portfolio (root project)

```
NEXT_PUBLIC_SUPABASE_URL        Supabase project URL (browser-safe)
NEXT_PUBLIC_SUPABASE_ANON_KEY   Supabase anon key (browser-safe)
RESEND_API_KEY                  Resend API key for contact form emails
RESEND_FROM_EMAIL               (optional) From address — must be Resend-verified domain
CONTACT_TO_EMAIL                (optional) Recipient email, default: sumitga@sumitgautam.tech
```

Copy `.env.local.example` to `.env.local` and fill in values.

### Admin panel (`admin/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY       Service role key (server-only, never browser)
NEXTAUTH_SECRET                 Random string for session signing
NEXTAUTH_URL                    Full URL of admin app (e.g. https://admin.sumitgautam.tech)
ADMIN_PASSWORD                  Password for the admin login page
```

## Supabase Database

All tables use Row Level Security (RLS):
- **Public SELECT** — anyone can read (anonymous)
- **Authenticated INSERT/UPDATE/DELETE** — admin panel only

### Portfolio tables

| Table | Purpose |
|---|---|
| `settings` | isSplash, useCustomCursor, googleTrackingID |
| `greeting` | Hero section text and links |
| `social_media_links` | GitHub, LinkedIn, Twitter, etc. |
| `skill_sections` | Skills page sections |
| `degrees` | Education entries |
| `certifications` | Certification cards |
| `experience_header` | Experience page header |
| `experience_sections` | Section groupings (Work, Volunteer, etc.) |
| `experiences` | Individual job entries |
| `projects_header` | Projects page header |
| `projects` | Project cards |
| `contact` | Contact page text and blog section |

### Resume tables

| Table | Purpose |
|---|---|
| `resume_header` | Name, title, phone, email, location, website, note |
| `resume_summary` | Professional summary paragraph |
| `resume_skills` | Skill rows with category + text |
| `resume_jobs` | Jobs with bullets (JSONB), company_description, stack_line |
| `resume_education_entries` | Degree + institution rows |
| `resume_certifications` | Single-row text blob |
| `resume_references` | Single-row text blob |

To apply schema from scratch: run `supabase/schema.sql` then `supabase/resume_schema.sql` in Supabase SQL Editor.
To fix a broken RLS-only migration: run `supabase/resume_patch.sql` (idempotent — safe to re-run).

### Critical Supabase pattern

`getSupabaseBrowser()` from `lib/supabase.js` **must never be called at the React component top level** — it will run during SSR and throw if env vars are not available. Always call it inside `useEffect` or inside event handler functions:

```js
// WRONG — crashes on SSR
const supabase = getSupabaseBrowser();

// CORRECT — lazy, called only in the browser
async function saveData() {
  const { error } = await getSupabaseBrowser().from("table").upsert(...);
}
```

## Features

### Resume / CV page (`/resume`)

- Server component fetches `getResumeData()` from Supabase (falls back to `resumeFallback` in `lib/portfolio-data.js` if Supabase unavailable)
- White A4-style card layout always renders in light colours regardless of site theme
- **Print / Download PDF**: `window.print()` + `@media print` CSS hides site chrome, scales to A4
- Key CSS rule: `.resume-page * { color: #1a1a1a !important }` overrides styled-components dark-mode `body { color: white }`

### Contact form (`/contact`)

- `ContactForm` component (`src/components/contactForm/`) submits to `POST /api/contact`
- API route sends email via Resend to `CONTACT_TO_EMAIL` (default `sumitga@sumitgautam.tech`)
- Reply-To is set to the sender's email so you can reply directly
- Without `RESEND_FROM_EMAIL` set, sends from `onboarding@resend.dev` (Resend's test address)
- To send from `noreply@sumitgautam.tech`, verify the domain in Resend dashboard and add the DNS records in Cloudflare

### Admin panel (`admin/`)

- Separate Next.js 15 project deployed to `admin.sumitgautam.tech` on a separate Vercel project
- Sections: Greeting, Skills, Experience, Education, Certifications, Projects, Contact, Resume/CV, Settings
- All admin pages use `getSupabaseBrowser()` lazily (never at component top level)
- Toast notifications use `useToast` — always pass `error ? "error" : "success"` (string), never a boolean
- Render Toast as `{Toast}` (JSX element value), never `<Toast />` (component)

## Deployment

### Portfolio (sumitgautam.tech)

Deployed on Vercel. **Production branch must be `main-branch`** (not `main`) — set in Vercel project Settings → Git → Production Branch.

Push to `main-branch` to deploy:
```bash
git push origin main-branch
```

Add these environment variables in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (optional — for custom domain sending)
- `CONTACT_TO_EMAIL` (optional)

### Admin panel (admin.sumitgautam.tech)

Separate Vercel project. Root directory set to `admin/`. Also uses `main-branch` as production branch.

Add all admin env vars listed above in that Vercel project's settings.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
