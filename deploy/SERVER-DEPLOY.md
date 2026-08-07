# Deploy instructions — Hassan portfolio (hassaan.meetshahbaz.pk)

Search keywords: `deploy hassaan`, `deploy glimzo`, `hassaan.meetshahbaz.pk`, `future updates`

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

## Manual server commands

```bash
ssh glimzo
cd ~/hassan-portfolio
git pull origin main
docker compose up -d --build
docker compose ps
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

## Notes

- Do **not** rsync the project for normal updates — always deploy from GitHub.
- Keep `.env` only on the server (never commit it).
- After code changes: commit → push to `main` → run `./scripts/deploy-glimzo.sh`
