# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install all deps (incl. dev) for prisma generate + tsc build
COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Bring over installed deps (includes the generated Prisma client and the
# prisma CLI used for `migrate deploy`), the compiled output, and the schema.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# Run as the built-in non-root user
USER node

EXPOSE 3001

# Apply pending migrations, then start the API. `migrate deploy` is safe to run
# on every boot — it only applies migrations not yet recorded in the DB.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
