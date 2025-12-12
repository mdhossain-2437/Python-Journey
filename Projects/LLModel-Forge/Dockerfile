# LLModel-Forge Docker Configuration
# Multi-stage build for production deployment

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 llmforge
USER llmforge

COPY --from=deps --chown=llmforge:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=llmforge:nodejs /app/dist ./dist
COPY --from=builder --chown=llmforge:nodejs /app/package.json ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server/index.js"]

