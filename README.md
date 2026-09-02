# SumitGautam.tech — Portfolio

Personal portfolio website built with Next.js 16 App Router and deployed to [sumitgautam.tech](https://sumitgautam.tech).

## Features

- **Home** — Hero section with greeting, skills showcase, and social links
- **Experience** — Work history with company logos and descriptions
- **Education** — Degrees and certification cards
- **Projects** — GitHub project cards with language badges
- **Contact** — Profile, social links, and a contact form with email delivery
- **Resume / CV** — Formatted CV page with a Download PDF button
- **Dark / Light theme** — Toggle in the header, persisted to localStorage
- **Admin panel** — CMS to edit all portfolio content via Supabase (separate deploy)

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router, Server Components
- [React 19](https://react.dev/)
- [Supabase](https://supabase.com/) — PostgreSQL + auth
- [styled-components](https://styled-components.com/) — Theming
- [Resend](https://resend.com/) — Contact form email delivery
- [Vercel](https://vercel.com/) — Hosting (portfolio + admin on separate projects)

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/SumitGA/SumitGautam.tech.git
cd SumitGautam.tech
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |

Without Supabase credentials the site runs using the static fallback data in `src/portfolio.js`. Without a Resend key the contact form will fail — comment out the form or skip email locally.

### 3. Run

```bash
npm run dev
# http://localhost:3000
```

## Customise Content

### Without a database (static mode)

Edit `src/portfolio.js` — all portfolio sections are plain JS objects.

### With Supabase (dynamic mode)

1. Create a Supabase project
2. Run `supabase/schema.sql` then `supabase/resume_schema.sql` in the SQL editor
3. Add env vars as above
4. Use the admin panel (see below) to edit content through a UI

## Admin Panel

The admin panel lives in `admin/` and is a separate Next.js 15 project deployed at `admin.sumitgautam.tech`.

```bash
cd admin
cp .env.local.example .env.local   # fill in Supabase + auth vars
npm install
npm run dev   # http://localhost:3001
```

Admin sections: Greeting · Skills · Experience · Education · Certifications · Projects · Contact · Resume/CV · Settings

## Resume / CV Page

The `/resume` route renders an A4-style CV card. Hit **Download PDF** to print it through the browser.

Content is editable in the admin panel under "Resume / CV" and stored in separate Supabase tables (`resume_header`, `resume_summary`, `resume_skills`, `resume_jobs`, `resume_education_entries`, `resume_certifications`, `resume_references`).

## Contact Form

The contact form on `/contact` posts to `POST /api/contact`, which sends an email via Resend to the portfolio owner. Reply-To is set to the sender's address.

By default emails come from Resend's `onboarding@resend.dev` test address. To send from your own domain (e.g. `noreply@yourdomain.com`), verify the domain in the Resend dashboard and set `RESEND_FROM_EMAIL` in your env vars.

## Deployment (Vercel)

### Portfolio

1. Push code to GitHub
2. Import repo in Vercel → set root directory to `.` (default)
3. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`
4. **Set Production Branch to `main-branch`** in Vercel Settings → Git (not `main`)
5. Connect your custom domain in Vercel Settings → Domains

### Admin panel

1. Create a **separate** Vercel project for the same repo
2. Set root directory to `admin/`
3. Set Production Branch to `main-branch`
4. Add admin env vars: Supabase keys, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_PASSWORD`
5. Connect `admin.yourdomain.com`

### Supabase migrations

Run SQL files in Supabase SQL Editor (Dashboard → SQL Editor):
1. `supabase/schema.sql` — portfolio tables
2. `supabase/resume_schema.sql` — resume tables

If RLS policies fail mid-run, `supabase/resume_patch.sql` is an idempotent patch that is safe to re-run.

## References

Based on [ashutosh1919/masterPortfolio](https://github.com/ashutosh1919/masterPortfolio) and [saadpasta/developerFolio](https://github.com/saadpasta/developerFolio).
Illustrations: [undraw.co](https://undraw.co/)
