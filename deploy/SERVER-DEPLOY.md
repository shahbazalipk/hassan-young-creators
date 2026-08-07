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
