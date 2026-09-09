# Multi-stage Dockerfile for Upgrid Worker Service

# Stage 1: Build stage
FROM node:24-alpine AS builder

# Install OpenSSL and libc compatibility for Prisma engine in Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@11.23.0 --activate

# Set placeholder DATABASE_URL for build-time Prisma Client generation
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Copy monorepo configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy packages and worker application
COPY packages/redisstream ./packages/redisstream
COPY packages/store ./packages/store
COPY apps/worker ./apps/worker

# Install all dependencies (including devDependencies required for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client for packages/store
RUN pnpm --filter store run generate

# Build packages and worker
RUN pnpm --filter store run build
RUN pnpm --filter worker run build

# Deploy isolated production bundle for worker
RUN pnpm --filter worker deploy --prod /prod/worker

# Stage 2: Production runner stage
FROM node:24-alpine AS runner

# Install OpenSSL for Prisma runtime in Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production

# Copy pruned production deployment bundle
COPY --from=builder --chown=node:node /prod/worker ./

# Run container as non-root user
USER node

# Container entry point to start worker process
CMD ["node", "dist/index.js"]
