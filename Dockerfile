# SCOPTIX application image (Next.js app + scan worker share this image)

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs scoptix

# Next.js standalone server
COPY --from=builder --chown=scoptix:nodejs /app/.next/standalone ./
COPY --from=builder --chown=scoptix:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=scoptix:nodejs /app/public ./public

# Scan worker runtime (tsx + source)
COPY --from=builder --chown=scoptix:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=scoptix:nodejs /app/package.json ./package.json
COPY --from=builder --chown=scoptix:nodejs /app/workers ./workers
COPY --from=builder --chown=scoptix:nodejs /app/lib ./lib
COPY --from=builder --chown=scoptix:nodejs /app/engines ./engines
COPY --from=builder --chown=scoptix:nodejs /app/prisma ./prisma
COPY --from=builder --chown=scoptix:nodejs /app/tsconfig.json ./tsconfig.json

USER scoptix
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
