# Upgrid Worker Service - AWS EC2 Docker Deployment Guide

This document explains how the Upgrid probe worker service is built via GitHub Actions CI/CD and deployed as Docker containers on AWS EC2 instances.

---

## 1. Architecture Overview

```
GitHub Actions CI/CD
        │
        ▼
  ghcr.io (GHCR)   ←──── docker pull ───→   EC2 #1 (e.g. ap-south-1 / India)
  upgrid-worker:latest                         └── upgrid-worker container
                    ←──── docker pull ───→   EC2 #2 (e.g. us-east-1 / US)
                                               └── upgrid-worker container
        │
        ▼
  AWS ElastiCache Serverless Valkey  (Shared centralized queue)
        │
        ▼
  Neon PostgreSQL  (Shared results database)
```

- **Queue Service:** AWS ElastiCache Serverless Valkey (Redis-compatible, shared across all workers).
- **Database:** Neon PostgreSQL (stores probe results from all regions).
- **Container Registry:** GitHub Container Registry (`ghcr.io`).
- **CI/CD Pipeline:** GitHub Actions (`.github/workflows/worker-ci.yml`).
- **Compute:** Two AWS EC2 instances, one per region.

---

## 2. CI/CD & Image Build

Whenever code in `apps/worker`, `packages/redisstream`, `packages/store`, or `Dockerfile` is merged to `main`:

1. GitHub Actions triggers automatically.
2. Multi-stage Docker build compiles TypeScript and generates Prisma client.
3. Image is tagged and pushed:
   - `ghcr.io/dipanshu-101/upgrid-worker:latest`
   - `ghcr.io/dipanshu-101/upgrid-worker:sha-<short-commit>`
4. Both EC2 instances can then pull the new image.

---

## 3. Create the Two EC2 Instances (AWS Console or CLI)

You need **two** EC2 instances, one per region. Recommended configuration:

| Setting | Value |
|---|---|
| AMI | Amazon Linux 2023 (or Ubuntu 22.04 LTS) |
| Instance type | `t3.micro` or `t3.small` (adjust to load) |
| Storage | 20 GB gp3 |
| Key pair | Your existing SSH key pair |
| Security Group | See below |

### Security Group Rules (for each EC2)

**Inbound:**

| Type | Port | Source | Purpose |
|---|---|---|---|
| SSH | 22 | Your IP only | SSH access |

**Outbound:**

| Type | Port | Destination | Purpose |
|---|---|---|---|
| HTTPS | 443 | 0.0.0.0/0 | GHCR image pull |
| Custom TCP | 6379 | ElastiCache Security Group ID | Valkey queue |
| PostgreSQL | 5432 | 0.0.0.0/0 | Neon DB (TLS) |

> **Important:** Your ElastiCache Security Group must allow inbound TCP 6379 from each EC2's Security Group.

---

## 4. Install Docker on Each EC2

SSH into each instance and run:

**Amazon Linux 2023:**
```bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
# Log out and back in for group to take effect
exit
```

**Ubuntu 22.04:**
```bash
sudo apt-get update -y
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
# Log out and back in for group to take effect
exit
```

Verify Docker is running:
```bash
docker info
```

---

## 5. Authenticate to GitHub Container Registry (GHCR)

On **each** EC2 instance:

1. Create a GitHub Personal Access Token (PAT):
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
   - Generate new token with `read:packages` scope only
   - Copy the token value

2. Log into GHCR on the EC2:
```bash
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u dipanshu-101 --password-stdin
```

Expected output:
```
Login Succeeded
```

---

## 6. Create the Environment File on Each EC2

Each EC2 must have its own `.env.worker` file with region-specific values.

### EC2 #1 — India Region (`ap-south-1`)

```bash
nano ~/.env.worker
```

Paste and fill in your real values:

```ini
# Worker identity
REGION="india"
REGION_ID="11111111-1111-4111-8111-111111111111"
WORKER_ID="ec2-india-worker-1"

# AWS ElastiCache Serverless Valkey
REDIS_HOST="your-valkey-cluster.serverless.ap-south-1.cache.amazonaws.com"
REDIS_PORT=6379
REDIS_USERNAME=""
REDIS_PASSWORD=""
REDIS_TLS="true"

# Neon PostgreSQL
DATABASE_URL="postgresql://username:password@ep-example.ap-south-1.aws.neon.tech/upgrid?sslmode=require"
```

### EC2 #2 — US Region (`us-east-1`)

```bash
nano ~/.env.worker
```

```ini
# Worker identity
REGION="us"
REGION_ID="22222222-2222-4222-8222-222222222222"
WORKER_ID="ec2-us-worker-1"

# AWS ElastiCache Serverless Valkey
REDIS_HOST="your-valkey-cluster.serverless.us-east-1.cache.amazonaws.com"
REDIS_PORT=6379
REDIS_USERNAME=""
REDIS_PASSWORD=""
REDIS_TLS="true"

# Neon PostgreSQL
DATABASE_URL="postgresql://username:password@ep-example.us-east-1.aws.neon.tech/upgrid?sslmode=require"
```

Restrict file permissions on **both** instances:
```bash
chmod 600 ~/.env.worker
```

---

## 7. Pull the Worker Image

On **each** EC2:

```bash
docker pull ghcr.io/dipanshu-101/upgrid-worker:latest
```

---

## 8. Run the Worker Container

On **each** EC2 (the `--env-file` path must match where you saved the file):

```bash
docker run -d \
  --name upgrid-worker \
  --restart unless-stopped \
  --env-file ~/.env.worker \
  ghcr.io/dipanshu-101/upgrid-worker:latest
```

**Parameter explanation:**

| Flag | Purpose |
|---|---|
| `-d` | Detached daemon mode (runs in background) |
| `--name upgrid-worker` | Name the container for easy management |
| `--restart unless-stopped` | Auto-restart on crash or EC2 reboot |
| `--env-file ~/.env.worker` | Inject environment variables from file |

---

## 9. Verify the Worker is Running

```bash
# Check container is running
docker ps

# View live logs (Ctrl+C to exit)
docker logs -f upgrid-worker
```

Expected log output:
```
Worker ec2-india-worker-1 listening on region india
```

---

## 10. Operations & Maintenance

### View Logs
```bash
docker logs -f upgrid-worker
```

### Check Resource Usage
```bash
docker stats upgrid-worker
```

### Restart the Worker
```bash
docker restart upgrid-worker
```

### Update to Latest Image Version

Run this on each EC2 after a new CI/CD build completes:

```bash
# Pull latest
docker pull ghcr.io/dipanshu-101/upgrid-worker:latest

# Stop and remove old container
docker stop upgrid-worker
docker rm upgrid-worker

# Start new container
docker run -d \
  --name upgrid-worker \
  --restart unless-stopped \
  --env-file ~/.env.worker \
  ghcr.io/dipanshu-101/upgrid-worker:latest
```

### Stop and Remove Container
```bash
docker stop upgrid-worker
docker rm upgrid-worker
```

---

## 11. AWS ElastiCache Configuration Checklist

Before starting the workers, ensure:

- [ ] ElastiCache Serverless Valkey cluster is **Active**.
- [ ] Valkey is in the **same VPC** as your EC2 instances (or VPC peering is configured).
- [ ] EC2 Security Groups are allowed as inbound source on the **ElastiCache Security Group**, port `6379`.
- [ ] TLS is enabled on the Valkey cluster — set `REDIS_TLS="true"` in each `.env.worker`.
- [ ] The correct Valkey **endpoint URL** is in each `.env.worker` (`REDIS_HOST`).
- [ ] The correct `REGION_ID` UUIDs match what is seeded in your **Neon PostgreSQL `Region` table**.
