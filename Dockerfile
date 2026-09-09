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
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./

# Copy all packages (including typescript-config, redisstream, store) and worker app
COPY packages ./packages
COPY apps/worker ./apps/worker

# Install all dependencies (including devDependencies required for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client for packages/store
RUN pnpm --filter store run generate

# Build packages and worker
RUN pnpm --filter store run build
RUN pnpm --filter worker run build

# Stage 2: Production runner stage
FROM node:24-alpine AS runner

# Install OpenSSL for Prisma runtime in Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production

# Copy root configuration, node_modules, packages, and worker app from builder
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker ./apps/worker

# Ensure node user owns app directory
RUN chown -R node:node /app

# Run container as non-root user
USER node

# Set working directory to worker application
WORKDIR /app/apps/worker

# Container entry point to start worker process
CMD ["node", "dist/index.js"]
