# Backend: Supabase + Resend

Every visit, every form step and every submission on the public site is
recorded in Supabase. The moment someone types a usable email or phone number
into a form, their details are saved, so if they stop part-way staff can reach
out by name ("Hi Precious, we saw you started your pre-enrolment…") and send a
link that reopens the form already filled in. Staff work all of this from a
**separate back-office app** on its own address.

```
 PUBLIC SITE (www.ninsupportatalanta.com)             BACK OFFICE (admin.ninsupportatalanta.com)
 ─────────────────────────────────────────            ──────────────────────────────────────────
 page views, clicks ─────▶ track ──────────┐          Overview    funnel, sources, drop-off, live
 form step 1 (name, email,                 │          Unfinished  people who stopped, resume links,
   phone) ──────────────▶ save-draft ──────┤ Supabase             WhatsApp / text / email by name
 every later keystroke ─▶ save-draft ──────┤ Postgres Submissions work queue, status, notes
 submit ────────────────▶ submit-form ─────┤  + RLS   Visitors    every session, step by step
                               │           │               │
                               └─▶ Resend ─┘               └─▶ admin-send-email ─▶ Resend
                                   applicant + staff emails        staff → applicant
```

## What's where

| Path | Purpose |
| --- | --- |
| `supabase/migrations/20260930000000_init.sql` | **The one schema file.** Tables, security, triggers, analytics |
| `supabase/functions/track` | First-party analytics: visits, pages, clicks, form milestones |
| `supabase/functions/save-draft` | Saves forms piece by piece; loads them for resume links |
| `supabase/functions/submit-form` | Validates and stores a finished form, emails applicant + staff |
| `supabase/functions/admin-send-email` | Staff email an applicant (finished or not) from the back office |
| `supabase/functions/_shared` | CORS, Resend client, email templates, journey helpers |
| `src/lib/analytics.ts`, `src/lib/forms.ts` | Public-site tracking and form calls (no Supabase SDK) |
| `src/components/forms/` | Two-step forms: contact details first, then the rest |
| `admin/`, `src/admin/`, `vite.admin.config.ts` | The back-office app (separate build and deployment) |

### How a form is captured

1. **Step 1 is always contact details**: first name, surname, email, phone, and
   "this number is on WhatsApp".
2. As soon as the email **or** phone is valid, a draft is saved. It keeps
   updating as they type, through step 2, and records the last field touched.
3. If they submit, the draft is marked **converted** and linked to the submission.
4. If they don't, 30 minutes after their last keystroke they appear under
   **Unfinished forms → Needs follow-up**, with everything they typed.
5. Staff reach out by WhatsApp, text, call or email (personalised templates),
   including a **resume link** (`https://www.ninsupportatalanta.com/?resume=…`)
   that reopens the form prefilled. Anyone who submits after that is counted
   as **recovered by staff**.

A short notice on step 1 tells applicants their progress is saved so the team
can help them finish.

### What is tracked

- **Visitors & sessions**: random IDs in the browser (no cookies, no third
  parties); first-touch source (utm tags, referrer, or direct), landing page,
  device/browser/OS, pages viewed, time on site, number of visits.
- **Events**: page views; clicks on buttons, phone, email and map links; form
  opened, started, moved to step 2, validation errors (which field), closed
  (at which step and field), resumed, contact captured, submitted.
- Browsers that send **Global Privacy Control** are not tracked; forms still work.
- Raw events are kept 13 months and unpursued drafts 6 months
  (`public.prune_analytics()`; the bottom of the SQL file shows how to schedule it).

### Security

- Anonymous visitors cannot read or write any table. Everything goes through
  the edge functions, which validate input, rate-limit, and drop bots.
- Only users listed in `public.admins` can read data, even if signed in.
- Admins can change status and assignee and add notes; they **cannot** alter
  what an applicant typed. Deletion exists for data-removal requests.
- The Resend key and service-role key exist only inside the edge functions.

---

## Setup

### 1. Environment file

```bash
cp .env.example .env.local
```

Fill in every value; the comments in `.env.example` say where each comes from.
Only `VITE_*` values ever reach a browser.

### 2. Database (run once)

Supabase dashboard → **SQL Editor → New query** → paste the whole of
`supabase/migrations/20260930000000_init.sql` → **Run**.

It is a single file for a fresh project; there is nothing else to run.
(CLI alternative: `npx supabase link --project-ref <ref>` then `npx supabase db push`.)

### 3. Supabase Auth

- **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up".
- **Authentication → URL Configuration**:
  - Site URL: `https://admin.ninsupportatalanta.com`
  - Redirect URLs: `https://admin.ninsupportatalanta.com/**` and `http://localhost:3001/**`
- **Authentication → Emails → SMTP Settings** (recommended, so sign-in links and
  password resets aren't limited to a few per hour): host `smtp.resend.com`,
  port `465`, user `resend`, password = your Resend API key, sender
  `noreply@ninsupportatalanta.com`.

### 4. Resend

Verify **`ninsupportatalanta.com`** under **Domains** (add the DNS records it
shows), then create an API key with **Sending access**, restricted to that domain.

### 5. Edge functions

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set --env-file .env.local
npx supabase functions deploy track
npx supabase functions deploy save-draft
npx supabase functions deploy submit-form
npx supabase functions deploy admin-send-email
```

`supabase/config.toml` already sets `verify_jwt = false` for all four: three
are public endpoints that protect themselves, and `admin-send-email` checks the
caller's session and admin membership itself.

### 6. First admin

1. **Authentication → Users → Add user → Create new user**, tick *Auto Confirm User*.
2. SQL Editor:

   ```sql
   insert into public.admins (user_id, email, full_name)
   select id, email, 'Sonia Edwin' from auth.users where email = 'staff@example.com';
   ```

   `full_name` signs their emails and WhatsApp/text messages (e.g. "Uncle Joshua").

Revoke access with `delete from public.admins where email = '…';`

### 7. Deploy the two apps separately

| App | Build | Output | Address |
| --- | --- | --- | --- |
| Public website | `npm run build` | `dist/` | `www.ninsupportatalanta.com` |
| Back office | `npm run build:admin` | `dist-admin/` | `admin.ninsupportatalanta.com` |

Create two sites on your host, one per folder, and set the `VITE_*` variables
on both. The public bundle contains none of the back-office code, the back
office is marked `noindex`, and neither needs special routing rules.

For extra protection, put the admin address behind your host's access control
(for example Cloudflare Access or Vercel password protection) in addition to
the Supabase sign-in.

---

## Local development

```bash
npm run dev          # public site  -> http://localhost:3000
npm run dev:admin    # back office  -> http://localhost:3001
```

Both read `.env.local`. Resume links in the back office use
`VITE_PUBLIC_SITE_URL`; set it to `http://localhost:3000` locally if you want
them to open your dev site.

## Tagging campaign links

Add `utm_source`, `utm_medium` and `utm_campaign` to links you share, and the
Overview attributes visits and submissions to them:

```
https://www.ninsupportatalanta.com/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=october-drive
```

## Troubleshooting

- **Forms say "Online submissions aren't available"**: `VITE_SUPABASE_*` weren't
  set when the site was built.
- **Nothing under Visitors**: check `track` is deployed and the site's origin is
  in `ALLOWED_ORIGINS`. Browsers with Global Privacy Control are skipped on purpose.
- **Submission saved but no email**: the record's timeline shows Resend's error
  (usually an unverified domain or wrong `EMAIL_FROM`).
- **"No admin access"**: the user isn't in `public.admins` (step 6).
- **Back office doesn't update live**: **Database → Publications →
  supabase_realtime** should list `submissions`, `form_drafts`, `submission_events`.
