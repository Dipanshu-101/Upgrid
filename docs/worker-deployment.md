# Upgrid Worker Service - AWS EC2 Docker Deployment Guide

This document explains how the Upgrid probe worker service is built via GitHub Actions CI/CD and deployed as a Docker container on an AWS EC2 instance.

---

## 1. Architecture Overview

- **Queue Service:** Centralized AWS ElastiCache Serverless Valkey (Redis compatible).
- **Database:** Neon PostgreSQL (stores website tick latency & probe results).
- **Container Registry:** GitHub Container Registry (`ghcr.io`).
- **CI/CD Pipeline:** GitHub Actions workflow (`.github/workflows/worker-ci.yml`).
- **Compute Host:** AWS EC2 instance running Docker engine.

---

## 2. CI/CD & Image Build Workflow

Whenever changes to worker-related code (`apps/worker`, `packages/redisstream`, `packages/store`, `Dockerfile`) are merged/pushed to the `main` branch:

1. **GitHub Actions** triggers automatically.
2. A multi-stage Docker build initializes, compiling TypeScript packages and generating Prisma assets.
3. The image is tagged as:
   - `ghcr.io/<github-owner>/upgrid-worker:latest`
   - `ghcr.io/<github-owner>/upgrid-worker:sha-<commit-hash>`
4. The image is pushed to GitHub Container Registry (`ghcr.io`).

---

## 3. Preparing the AWS EC2 Instance

Before running the worker container on EC2:

1. Ensure **Docker** is installed and running on your EC2 instance.
2. Ensure the EC2 Security Group allows outbound traffic to:
   - AWS ElastiCache Serverless Valkey endpoint (Port `6379`).
   - Neon PostgreSQL database endpoint (Port `5432`).
   - GitHub Container Registry (`ghcr.io`, Port `443`).

---

## 4. EC2 Deployment Instructions

### Step 1: Authenticate to GitHub Container Registry (GHCR)

Generate a GitHub Personal Access Token (PAT) with `read:packages` scope (or use your GitHub access token), then log in:

```bash
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Step 2: Create Environment Variable File on EC2

Create a secure environment file `.env.worker` in a protected folder on your EC2 instance:

```bash
nano .env.worker
```

Paste your production credentials into `.env.worker` (refer to `.env.worker.example`):

```ini
REGION="india"
REGION_ID="11111111-1111-4111-8111-111111111111"
WORKER_ID="ec2-worker-1"

REDIS_HOST="your-valkey-cluster-endpoint.serverless.us-east-1.cache.amazonaws.com"
REDIS_PORT=6379
REDIS_USERNAME=""
REDIS_PASSWORD=""
REDIS_TLS="true"

DATABASE_URL="postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/upgrid?sslmode=require"
```

Restrict file permissions:

```bash
chmod 600 .env.worker
```

### Step 3: Pull the Worker Image from GHCR

Replace `<owner>` with your GitHub organization or username:

```bash
docker pull ghcr.io/<owner>/upgrid-worker:latest
```

### Step 4: Launch the Worker Container

Run the worker container in detached daemon mode using `--env-file`:

```bash
docker run -d \
  --name upgrid-worker \
  --restart unless-stopped \
  --env-file .env.worker \
  ghcr.io/<owner>/upgrid-worker:latest
```

---

## 5. Operations & Maintenance

### View Live Container Logs

```bash
docker logs -f upgrid-worker
```

### Inspect Container Status & Resource Usage

```bash
docker ps -f name=upgrid-worker
docker stats upgrid-worker
```

### Restart the Worker Container

```bash
docker restart upgrid-worker
```

### Update Worker to the Latest Image Version

When a new version is pushed to GHCR:

```bash
# 1. Pull latest image
docker pull ghcr.io/<owner>/upgrid-worker:latest

# 2. Stop and remove existing container
docker stop upgrid-worker
docker rm upgrid-worker

# 3. Launch container with updated image
docker run -d \
  --name upgrid-worker \
  --restart unless-stopped \
  --env-file .env.worker \
  ghcr.io/<owner>/upgrid-worker:latest
```

### Stop and Remove Container

```bash
docker stop upgrid-worker
docker rm upgrid-worker
```
