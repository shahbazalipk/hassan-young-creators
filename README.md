# Hassan Young Creators Platform

A child-safe personal portfolio and inspiration platform for **Hassan** (age 10, Class 5), with a secure parent/guardian admin dashboard.

This is a real full-stack app (Next.js + Prisma + SQLite). Security is **not** faked in the browser.

## Features

- Public portfolio with Hassan’s existing sections preserved and improved
- **Young Creators Club** (roadmap, challenges, badges, idea generator, inspiration wall, resources, parent corner)
- Parent-managed contact inbox (`PARENT_CONTACT_EMAIL` stays server-side)
- Secure `/admin` dashboard: projects, profile (incl. avatar), messages, moderation, challenges, resources/badges, settings, 2FA
- CSRF protection, rate limiting, password hashing, session cookies, secure headers
- Visitor submissions require parent approval before becoming public
- Prisma schema + SQL migration under `prisma/migrations/`

## Quick start

```bash
cp .env.example .env
# Edit .env — set strong SESSION_SECRET, CSRF_SECRET, ADMIN_PASSWORD, PARENT_CONTACT_EMAIL

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open:

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin/login

Default seed admin uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. **Change the password after first login.**

## Environment variables

See `.env.example`. Important values:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file path |
| `SESSION_SECRET` | Encrypted admin session (32+ chars) |
| `CSRF_SECRET` | CSRF HMAC secret (32+ chars) |
| `PARENT_CONTACT_EMAIL` | Parent inbox (server-only) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial parent admin account |
| `SMTP_*` | Optional email delivery for contact alerts + password reset |

If SMTP is not configured, contact messages are still saved in the admin inbox and the public form shows a friendly fallback.

## Architecture

```
app/                  Next.js App Router (public + admin + API)
components/           Public + admin UI
lib/                  Auth, CSRF, rate limit, validation, email, uploads
prisma/               Schema + seed
public/uploads/       Safe re-encoded image uploads
```

### Security model

- Parent/guardian login only (`PARENT_ADMIN` role)
- Passwords hashed with bcrypt (cost 12)
- HttpOnly encrypted iron-session cookies
- Failed-login rate limiting + temporary lockout
- Optional TOTP 2FA
- Password reset via hashed one-time token emailed to parent
- CSRF tokens on mutating requests
- Honeypot + content filters on public forms
- Upload allow-list (JPEG/PNG/WebP), size limit, sharp re-encode (metadata stripped)
- Security headers (CSP, frame deny, nosniff, referrer policy)

## Child-safety rules enforced

- No home address, phone, school name, personal child email, or location tracking on the public site
- No child-to-child private messaging
- Contact managed by Hassan’s parent/guardian
- Inspiration/challenge submissions stay **pending** until approved
- Sensitive-info filter blocks common phone/email/address patterns in kid submissions

## Production

```bash
npm run build
npm start
```

Use a strong unique `SESSION_SECRET` / `CSRF_SECRET`, configure SMTP, and keep `.env` off the public web.

## Tests

```bash
npm test
```

## Legacy static site

The original HTML/CSS/JS prototype is archived in `_legacy/` for reference. The live app is this Next.js platform.
