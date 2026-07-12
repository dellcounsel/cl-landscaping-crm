# FieldBook

A mobile-first CRM for a small landscaping business — clients, quotes, jobs,
scheduling, and invoices. Built to run entirely on free tiers (Vercel +
Supabase + Resend) and optimized for use on a phone in the field.

## Status

Milestone-based build. **M1 is complete.**

| Milestone | Scope | Status |
|-----------|-------|--------|
| **M1** | Auth, roles, app shell, Clients, Price list | ✅ Done |
| M2 | Quotes + email + public approval page | ⬜ Next |
| M3 | Jobs + recurrence engine + Today view | ⬜ |
| M4 | Google Calendar sync | ⬜ |
| M5 | Invoices + payments + dashboard | ⬜ |
| M6 | Polish, seed, docs | ⬜ |

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **Supabase** (Postgres + Auth, email/password) with Row Level Security
- **Vercel** hosting (+ Vercel Cron in M3+)
- **Resend** email (M2), **Google Calendar** sync (M4)

## Roles

- **Owner** — full access: clients, price list, quotes, invoices, payments,
  settings, reports. Owners also do field work (Today view, mark jobs done).
- **Crew** — today's/this week's schedule, job details, mark complete, add
  notes/photos. **No** access to pricing, quotes, invoices, or financials.

New signups default to `crew`; the first owner is created by the seed script.

---

## Local setup

### 1. Create a Supabase project

1. Go to <https://supabase.com>, create a free project. Pick a region close to
   you and save the database password.
2. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secret — server only)

### 2. Run the database migrations

The SQL lives in [`supabase/migrations/`](supabase/migrations). Run the files
**in order** (0001 → 0004).

**Easiest (no tools):** open the Supabase dashboard → **SQL Editor** → **New
query**, paste the contents of each migration file in numeric order, and run
each one.

**Or with the Supabase CLI:**

```bash
npm i -g supabase
supabase link --project-ref <your-project-ref>
supabase db push
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase values from step 1. For M1 you only need the three
`SUPABASE`/`NEXT_PUBLIC_SUPABASE` values, `APP_URL`, and the three `SEED_OWNER_*`
values. The rest are for later milestones.

### 4. Seed the owner account + demo data

Set `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD`, and `SEED_OWNER_NAME` in
`.env.local`, then:

```bash
npm run seed
```

This creates your owner login and loads 5 demo clients and a price list. It's
safe to re-run (it upserts the demo rows).

### 5. Run the app

```bash
npm install   # first time only
npm run dev
```

Open <http://localhost:3000> on your phone or in a mobile viewport and log in
with your seeded owner email/password.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new>.
3. Add every variable from `.env.local` to the Vercel project's **Environment
   Variables** (set `APP_URL` to your production URL, e.g.
   `https://fieldbook.vercel.app`).
4. Deploy. Run the migrations against your Supabase project (step 2) if you
   haven't already.

## Notes

- **Supabase free-tier pause:** free projects pause after ~1 week of
  inactivity. If the app can't reach the database, open the Supabase dashboard
  to resume it. A weekly external ping (e.g. a cron-job.org GET to a health
  route) can keep it warm — added in a later milestone.
- **Money** is stored as integer cents throughout; formatted to USD at the UI.
- **Timezone** is America/New_York for all scheduling and dates.
- Public quote/invoice pages (M2/M5) use unguessable tokens and expose only the
  single document, never account data.

## Project layout

```
app/
  (app)/            authenticated shell + bottom-tab pages
    today/ schedule/ clients/ invoices/ more/ price-list/
  login/            email/password sign-in
lib/
  supabase/         browser / server / proxy / service clients
  auth.ts           getProfile / requireProfile / requireOwner
  money.ts dates.ts database.types.ts
supabase/migrations/  ordered SQL (schema + RLS)
scripts/seed.mjs      owner + demo data
proxy.ts              session refresh + route gating (Next 16 proxy)
```
