# Production image for Hassan portfolio (Next.js + Prisma SQLite)
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN mkdir -p /data public/uploads \
  && npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:/data/prod.db"
ENV DATA_DIR=/data
EXPOSE 3000

CMD ["node", "scripts/start-production.mjs"]
