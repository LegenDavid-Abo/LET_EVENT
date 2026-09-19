# Evently

Premium event invitations, device-uploaded cover photos, a live embedded map,
digital tickets, and secure single-use QR check-in — built with Next.js,
Supabase and Brevo.

## 1. Install

```bash
npm install
```

## 2. Supabase

1. Create a Supabase project.
2. In the SQL editor, run `supabase/schema.sql`. This creates the tables,
   row-level security policies, and a public `covers` storage bucket used
   for cover-photo uploads from the admin dashboard.
   - Already have a database from an earlier version of this project? Run
     `supabase/migrations/001_premium_upgrade.sql` instead — it adds the
     missing admin policies and the storage bucket without touching your
     existing data.

## 3. Environment

Copy `.env.example` to `.env.local` and fill in your Supabase URL, keys,
Brevo credentials, and app URL. Never expose the service-role or Brevo keys
in client-side code.

## 4. Create your admin login

```bash
npm run seed:admin
```

This creates (or resets) a default admin account using
`DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` from `.env.local`
(defaults to `admin@evently.app` / `Evently-Admin-2026!` if unset). Log in
at `/admin/login` and change the password from the Supabase dashboard
afterwards. Set `NEXT_PUBLIC_DEMO_ADMIN_EMAIL` / `_PASSWORD` (matching the
values above) if you'd like a "use demo credentials" shortcut on the login
screen during development — leave them unset in production.

## 5. Run

```bash
npm run dev
```

Open http://localhost:3000

- Admin: `/admin/login`
- Scanner: `/scan`

## 6. Vercel

Import the GitHub repository, add the same environment variables in Vercel,
and deploy.

## Notes

- **Cover photos** are picked straight from the device in the admin form
  and uploaded to the `covers` Supabase Storage bucket — there's no URL
  field to fill in by hand.
- **Location** is entered as a venue name/address and rendered as a live,
  interactive Google Map (pan, zoom, directions) on both the event page and
  the admin live preview. No Google Maps API key is required.
- **Live preview**: the event editor shows a real-time preview of the
  public invitation page as you fill in the form.
- **Phone numbers** use a searchable country-code picker (`components/PhoneField.tsx`).
  The number is validated for the selected country with `libphonenumber-js`
  and marked invalid inline if it doesn't match — nothing invalid reaches
  the database.
- **One registration per email, per event**: `/api/register` rejects an
  email that has already registered for that specific event, but the same
  email can register for a *different* event.
- **Deleting an event** (from the dashboard, with a confirmation dialog)
  removes its cover image from storage, then deletes the event row — which
  cascades to remove every registration, ticket, and check-in record tied
  to it in the database. This cannot be undone.
- The dashboard shows live counts of events, published events,
  registrations and tickets issued, fetched in parallel for a fast load.
- The ticket QR contains a high-entropy random URL token. The database
  stores only its SHA-256 hash. Check-in is an atomic PostgreSQL state
  transition (`UNUSED` → `USED`), preventing two simultaneous scanners from
  both approving the same ticket.

## Troubleshooting

**"Module not found: Can't resolve '@/components/...'"** — this means
`tsconfig.json`'s path alias isn't being picked up, almost always because
of a stale `.next` cache or files left over from an older copy of the
project in the same folder. Fix:

```bash
rm -rf .next node_modules
npm install
npm run dev
```

If you're re-using a folder that already had a different project in it
(rather than extracting into a fresh, empty folder), extract into a new
empty folder instead and copy your `.env.local` over — don't merge the two.
