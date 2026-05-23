# ==============================================================================
# ERP Backend — Production Dockerfile
# NestJS + Prisma on Node 22 Alpine
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Builder
# Install all dependencies (including devDeps) and compile TypeScript
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Build tools needed for native addons (bcrypt uses node-gyp)
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests first → maximise layer cache reuse
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Install all deps (devDeps needed for build)
RUN npm ci --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Copy source and compile
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production runtime
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends dumb-init openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

RUN npm ci --omit=dev --ignore-scripts

RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/i18n ./src/i18n

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' docker-entrypoint.sh \
    && chmod +x docker-entrypoint.sh

RUN mkdir -p uploads logs \
    && chown -R node:node /app

USER node

EXPOSE 9000

ENTRYPOINT ["dumb-init", "--", "/app/docker-entrypoint.sh"]
