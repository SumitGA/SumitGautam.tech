# SumitGautam.tech — Portfolio

Personal portfolio website built with Next.js 16 App Router and deployed to [sumitgautam.tech](https://sumitgautam.tech).

## Features

- **Home** — Hero section with greeting, skills showcase, and social links
- **Experience** — Work history with company logos and descriptions
- **Education** — Degrees and certification cards
- **Projects** — Project cards with language badges, plus opt-in **case studies** covering the problem, approach and outcome
- **Blog** — Markdown posts with server-rendered syntax highlighting, tags, drafts, scheduled publishing and an RSS feed
- **Contact** — Profile, social links, and a contact form with email delivery
- **Resume / CV** — Formatted CV page with a Download PDF button
- **AI chat assistant** — Floating widget on the home page that answers visitor questions, grounded in the site's own resume data
- **Analytics** — First-party, self-hosted: visitors, retention cohorts and conversion tracking, with no third-party service and no cookies
- **Dark / Light theme** — Toggle in the header, persisted to localStorage
- **Admin panel** — CMS to edit all content, including the blog editor, via Supabase (separate deploy)

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router, Server Components
- [React 19](https://react.dev/)
- [Supabase](https://supabase.com/) — PostgreSQL + auth
- [styled-components](https://styled-components.com/) — Theming
- [Resend](https://resend.com/) — Contact form email delivery
- [Google Gemini](https://ai.google.dev/) — AI chat assistant (free tier)
- [Shiki](https://shiki.style/) + [remark](https://remark.js.org/) — Markdown and syntax highlighting, rendered server-side
- [Cloudinary](https://cloudinary.com/) — Blog image hosting, transformation and delivery
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
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (server-only) |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — free, no card |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard — not a secret, it appears in every image URL |
| `REVALIDATE_SECRET` | Any random string (`openssl rand -hex 32`); must match the admin project |

Every integration degrades on its own. Without Supabase the site runs on the static fallback data in `src/portfolio.js`. Without a Resend key the contact form returns a 503, without a Gemini key the chat widget does the same, and without a Cloudinary cloud name posts simply render without images. Nothing takes the rest of the site down with it.

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
2. Run the SQL files from `supabase/` in the SQL editor, in the order listed under [Supabase migrations](#supabase-migrations)
3. Add env vars as above
4. Use the admin panel (see below) to edit content through a UI

## Admin Panel

The admin panel lives in `admin/` and is a separate Next.js 15 project deployed at `admin.sumitgautam.tech`.

```bash
cd admin
cp .env.local.example .env.local   # fill in Supabase, Cloudinary and revalidate vars
npm install
npm run dev   # http://localhost:3001
```

Admin sections: Greeting · Skills · Experience · Education · Certifications · Projects · Blog · Contact · Resume/CV · Analytics · Settings

**Login uses Supabase Auth** — create a user in the Supabase dashboard under Authentication → Users and sign in with that email and password. There is no separate admin password to configure.

Saving anything in the admin pushes a cache purge to the portfolio, so edits appear on the live site immediately rather than waiting for a revalidation window. That needs `REVALIDATE_SECRET` set to the same value in both projects; without it saves still work and the site falls back to an hourly refresh.

## Resume / CV Page

The `/resume` route renders an A4-style CV card. Hit **Download PDF** to print it through the browser.

Content is editable in the admin panel under "Resume / CV" and stored in separate Supabase tables (`resume_header`, `resume_summary`, `resume_skills`, `resume_jobs`, `resume_education_entries`, `resume_certifications`, `resume_references`).

## Contact Form

The contact form on `/contact` posts to `POST /api/contact`, which sends an email via Resend to the portfolio owner. Reply-To is set to the sender's address.

By default emails come from Resend's `onboarding@resend.dev` test address. To send from your own domain (e.g. `noreply@yourdomain.com`), verify the domain in the Resend dashboard and set `RESEND_FROM_EMAIL` in your env vars.

## AI Chat Assistant

A floating chat widget on the home page answers visitor questions about your background.

The system prompt is assembled from your live Supabase data — resume summary, skills, every job with its bullets, education, certifications and projects — so answers stay accurate and update automatically whenever you edit content in the admin panel. It's instructed to answer only from that data and to point visitors at the contact form for anything it doesn't know.

**Rate limiting** is enforced per IP by a Postgres function (`supabase/chat_rate_limit.sql`), defaulting to 15 messages per hour. Tune it with `CHAT_RATE_LIMIT` and `CHAT_RATE_WINDOW_SECONDS` — no code change needed.

**Model note:** the default is `gemini-3.1-flash-lite`. Google's full Flash models are capped at **20 requests/day** on the free tier, which a public site exhausts almost immediately — Flash-Lite has a much higher allowance. If you change `GEMINI_MODEL`, test the streaming path specifically: some models serve `generateContent` fine but stall on `generateContentStream`.

## Blog

Posts live at `/blog`, are written in markdown through the admin panel, and are stored in Supabase.

**Markdown, not HTML.** Content is stored as raw markdown in a text column, so `select slug, content from posts` gives you a directory of `.md` files if you ever move off this stack. Storing rendered HTML is how blogs become unmigratable.

**Syntax highlighting is server-side.** [Shiki](https://shiki.style/) runs at build time and emits both light and dark themes as CSS variables, so code blocks follow the theme toggle with no client-side highlighter and no flash of unstyled code. Adding callouts or diagrams later is a plugin in `lib/markdown.js` — existing posts start rendering better with no migration.

**Images go to Cloudinary**, uploaded straight from the browser using a signature minted server-side, so the API secret never reaches the client. Cover images store a `public_id` rather than a URL, so changing cloud accounts or transformations is an environment-variable edit rather than a rewrite of every post. Deleting a post also deletes its images, unless another post is using them.

**Renaming a published post keeps the old URL working.** Every slug a post has ever had is recorded by a database trigger, and old addresses redirect permanently to the current one.

**Drafts and scheduling** come from Row Level Security rather than application code: the public policy only exposes posts that are published *and* whose date has arrived, so dating a post in the future publishes it on its own.

Tags get real pages at `/blog/tag/<tag>`, there is an RSS feed at `/blog/rss.xml`, and posts and tags are added to the sitemap automatically — publishing needs no deploy.

## Analytics

Self-hosted in your own Supabase, with no third-party service and no cookies. The admin panel has a dashboard covering visitors, sessions, pageviews, bounce rate, new versus returning, a traffic chart, top pages, referrers, countries and devices, conversion rates, and weekly retention cohorts.

**Nothing identifying is stored.** The IP address is used to rate limit and never written; the user agent is reduced to a device class and browser name and discarded. Visitor and session identifiers are random UUIDs minted in the browser — not derived from the visitor, not cookies, not shared across sites. Referrers are truncated to the host.

Ingest goes through `POST /api/analytics` using the service role. The events table has no INSERT policy on purpose: the anon key is public, so if it could write, anyone could forge events. The endpoint returns 204 on every failure path, including a missing table — analytics breaking should cost you data, not a working site.

Conversions tracked: contact form submissions, resume downloads, chat opens and messages, outbound link clicks and case study views.

Because the identifier lives in `localStorage`, a strict reading of ePrivacy would call for consent in the EU. See the Analytics section of `CLAUDE.md` for the reasoning and the no-storage alternative.

## Deployment (Vercel)

### Portfolio

1. Push code to GitHub
2. Import repo in Vercel → set root directory to `.` (default)
3. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `REVALIDATE_SECRET`
4. **Set Production Branch to `main-branch`** (not `main`)
5. Connect your custom domain, and make the **apex primary** with `www` redirecting to it — every canonical URL and sitemap entry uses the apex, so the reverse would give search engines conflicting signals

**`NEXT_PUBLIC_` variables must be added as Config, not Secret.** Vercel blocks the combination, correctly: the prefix inlines the value into browser JavaScript, so it cannot also be secret. They are public by design — the Supabase anon key is protected by Row Level Security, not by being hidden. They are also inlined at **build time**, so redeploy after adding one.

### Admin panel

1. Create a **separate** Vercel project for the same repo
2. Set root directory to `admin/`
3. Set Production Branch to `main-branch`
4. Add admin env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
5. Connect `admin.yourdomain.com`

`CLOUDINARY_API_SECRET` must be a Secret and must never carry the `NEXT_PUBLIC_` prefix. Login is Supabase Auth — create a user under Authentication → Users; there is no admin password variable.

### Supabase migrations

Run SQL files in Supabase SQL Editor (Dashboard → SQL Editor), in order. All are idempotent and safe to re-run:

1. `supabase/schema.sql` — portfolio tables
2. `supabase/resume_schema.sql` — resume tables
3. `supabase/project_case_studies.sql` — case study columns on `projects`
4. `supabase/chat_rate_limit.sql` — chat rate limiting
5. `supabase/analytics_schema.sql` — analytics events and aggregation functions
6. `supabase/rate_limit.sql` — shared rate limiter used by the contact form
7. `supabase/blog_schema.sql` — posts, slug history and image ownership

If RLS policies fail mid-run, `supabase/resume_patch.sql` is an idempotent patch that is safe to re-run.

## References

Based on [ashutosh1919/masterPortfolio](https://github.com/ashutosh1919/masterPortfolio) and [saadpasta/developerFolio](https://github.com/saadpasta/developerFolio).
Illustrations: [undraw.co](https://undraw.co/)
