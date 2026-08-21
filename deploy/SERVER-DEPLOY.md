# Deploy instructions — Hassan portfolio (hassaan.meetshahbaz.pk)

Search keywords: `deploy hassaan`, `deploy glimzo`, `hassaan.meetshahbaz.pk`, `future updates`

## STRICT RULE

**Never update live server files by hand.**

Correct channel only:

1. Change code/config **locally**
2. `git commit`
3. `git push origin main`
4. `./scripts/deploy-glimzo.sh`

Forbidden:

- editing app files directly on `glimzo`
- rsync/scp of project code for normal updates
- patching production with nano/vim
- touching other projects on the server (nespak, meetshahbaz, n8n, etc.)

Allowed on server only via deploy script:

- `git fetch/reset` from GitHub
- `docker compose up -d --build`
- applying Hassan Apache configs from this repo
- reading logs / status checks

`.env` stays on the server and is never committed.

## One-liner (preferred)

From this repo on your Mac:

```bash
./scripts/deploy-glimzo.sh
```

Push local `main` first, then deploy:

```bash
./scripts/deploy-glimzo.sh --push
```

Check only:

```bash
./scripts/deploy-glimzo.sh --status
```

## Important paths

| Item | Value |
|---|---|
| Public URL | `https://hassaan.meetshahbaz.pk/` |
| KidMind AI | `https://hassaan.meetshahbaz.pk/kidmind-ai` |
| Flash Cards | `https://hassaan.meetshahbaz.pk/flash-cards` |
| GitHub | `https://github.com/shahbazalipk/hassan-young-creators` |
| SSH host | `glimzo` |
| Server app dir | `~/hassan-portfolio` |
| Env file on server | `~/hassan-portfolio/.env` |
| Deploy script | `scripts/deploy-glimzo.sh` |
| Apache HTTP config | `deploy/apache-hassaan.meetshahbaz.pk.conf` |
| Apache SSL config | `deploy/apache-hassaan.meetshahbaz.pk-le-ssl.conf` |
| Admin Visitors | `https://hassaan.meetshahbaz.pk/admin/visitors` |
| Admin Quiz Insights | `https://hassaan.meetshahbaz.pk/admin/quiz-insights` |

## Shared authentication (same-origin SSO)

The three “websites” are **same origin** (path-based), not separate domains:

| Site | URL |
|---|---|
| Portfolio | `https://hassaan.meetshahbaz.pk/` |
| KidMind AI | `https://hassaan.meetshahbaz.pk/kidmind-ai` |
| Flash Cards | `https://hassaan.meetshahbaz.pk/flash-cards` |

Shared login uses one HTTP-only iron-session cookie: `hassan_auth_session` (`path=/`).

### Designate the initial administrator (no password in git)

On the server `.env` only:

```bash
ADMIN_EMAIL="your-real-admin@email.com"
ADMIN_PASSWORD="a-long-random-password"
ADMIN_NAME="Hassan's Parent"
```

Redeploy (seed upserts `AppUser` with `role=ADMIN`). Never put these values in frontend code or `NEXT_PUBLIC_*` variables.

Regular signup always creates `role=USER`.

This is **not** Firebase — no Firebase Console steps.


On container start, `scripts/start-production.mjs` runs:

1. `scripts/cleanup-duplicate-emails.ts` — merges duplicate `AppUser` / `AdminUser` emails (and blank `googleSub` conflicts) **before** unique indexes are applied
2. `prisma db push`
3. `prisma/seed.ts`
4. `scripts/seed-flash-questions.ts` (curated Flash Cards bank + age metadata)

Manual local cleanup:

```bash
npm run db:cleanup-emails
npx prisma db push
```

### Optional Google Sign-In (manual)

1. Google Cloud Console → APIs & Services → Credentials → Create **OAuth 2.0 Client ID** (Web).
2. Authorized JavaScript origins: `https://hassaan.meetshahbaz.pk`
3. Authorized redirect URIs: `https://hassaan.meetshahbaz.pk` (GIS popup/token flow).
4. On the server `.env` add:

```bash
GOOGLE_CLIENT_ID="your-web-client-id.apps.googleusercontent.com"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-web-client-id.apps.googleusercontent.com"
```

5. Redeploy so the container picks up env (`./scripts/deploy-glimzo.sh`).

No Firebase project, Firestore rules, or service-account keys are required for this portfolio.
