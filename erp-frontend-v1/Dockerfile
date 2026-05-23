# ==============================================================================
# ERP Frontend — Production Dockerfile
# Vite/React build → served by Nginx
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Builder
# Install dependencies and run `vite build`
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=

# Copy dependency manifests first → cache npm install layer
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build in production mode (triggers console/debugger stripping in vite.config.ts)
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production — Nginx serving static assets
# The compiled React SPA lives in /usr/share/nginx/html.
# Nginx config is volume-mounted at runtime (from ./nginx/nginx.conf) so the
# reverse-proxy rules (e.g. /api → backend) stay outside this image.
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Remove the default catch-all server block
RUN rm /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx user already owns /var/cache/nginx; give it access to our html root
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

