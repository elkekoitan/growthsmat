# SmartGrowth OS — çok aşamalı Next.js 16 (standalone) Docker imajı (Coolify uyumlu)
FROM node:22-alpine AS base
RUN apk add --no-cache openssl

# --- bağımlılıklar ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# --- build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- production runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated
# Prisma CLI (migrate deploy) + sürücü bağdaştırıcısı standalone izlemesine dahil olmayabilir
# (dinamik require/CLI çağrısı, statik import değil) — tüm node_modules'ı üzerine kopyala.
# Coolify tarafında self-hosted tek konteynerde imaj boyutu değil güvenilirlik önceliklidir.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
