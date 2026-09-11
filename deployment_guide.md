# Upgrid — Production Distributed Deployment Guide

> **Architecture Overview:**
> - **Frontend:** Next.js (`apps/web`) hosted on **Vercel**
> - **Backend API:** Express.js REST API (`apps/api`) hosted on **Railway**
> - **Database:** Neon Serverless PostgreSQL (`packages/store`)
> - **Queue / Message Broker:** AWS ElastiCache Serverless Valkey (`packages/redisstream`)
> - **Scheduler / Pusher:** Daemon (`apps/pusher`) running in Docker on **AWS EC2**
> - **Regional Worker Pool:** Distributed workers (`apps/worker`) running in Docker on **AWS EC2 across multiple regions** (e.g., India & US)

---

## 1. High-Level System Architecture & Communication Topology

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               UPGRID DISTRIBUTED TOPOLOGY                              │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ USER BROWSER ]
        │
        │ HTTPS (Web Traffic)
        ▼
 ┌─────────────────────────┐
 │    Vercel (Frontend)    │
 │    - Next.js (apps/web) │
 └──────────┬──────────────┘
            │
            │ REST API (JSON / Bearer JWT)
            ▼
 ┌─────────────────────────┐
 │   Railway (API Service) │
 │   - Express (apps/api)  │
 └──────────┬──────────────┘
            │
            │ PostgreSQL Connection over TLS (DATABASE_URL)
            ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                            Neon Serverless PostgreSQL                                 │
 │                            Tables: User, Website, Region, website_tick                │
 └──────────▲─────────────────────────────▲───────────────────────────▲──────────────────┘
            │                             │                           │
            │ Read active websites        │ Persist telemetry tick    │ Persist telemetry tick
            │                             │                           │
 ┌──────────┴──────────────┐   ┌──────────┴─────────┐      ┌──────────┴─────────┐
 │       AWS EC2 #1        │   │     AWS EC2 #2     │      │     AWS EC2 #3     │
 │    (Pusher Service)     │   │ (Worker - Region1) │      │ (Worker - Region2) │
 │     - apps/pusher       │   │ e.g. ap-south-1    │      │ e.g. us-east-1     │
 └──────────┬──────────────┘   └──────────▲─────────┘      └──────────▲─────────┘
            │                             │                           │
            │ XADD & XTRIM                │ XREADGROUP                │ XREADGROUP
            │                             │ & XACK                    │ & XACK
            ▼                             │                           │
 ┌────────────────────────────────────────┴───────────────────────────┴──────────────────┐
 │                         AWS ElastiCache Serverless Valkey                             │
 │                         Stream: upgrid:probes                                         │
 └───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Communication Matrix

| Source | Destination | Protocol | Purpose / Data Transferred | Configuration Required |
| :--- | :--- | :--- | :--- | :--- |
| **Browser** | **Vercel** (`apps/web`) | HTTPS | UI delivery & dashboard rendering | Public domain / `*.vercel.app` |
| **Vercel** (`apps/web`) | **Railway** (`apps/api`) | HTTPS | REST endpoints (User auth, website registration, status query) | `NEXT_PUBLIC_API_URL="https://upgrid-api.up.railway.app"` |
| **Railway** (`apps/api`) | **Neon PostgreSQL** | TCP (TLS) | Reads/writes Users, Websites, queries ticks | `DATABASE_URL` with `?sslmode=require` |
| **EC2 Pusher** (`apps/pusher`) | **Neon PostgreSQL** | TCP (TLS) | Reads list of active target website URLs every 2 minutes | `DATABASE_URL` with `?sslmode=require` |
| **EC2 Pusher** (`apps/pusher`) | **AWS Valkey** | TCP (TLS / `rediss://`) | Pushes probe batch (`XADD`) & evicts entries older than 15m (`XTRIM`) | `REDIS_URL="rediss://your-valkey-endpoint:6379"` |
| **EC2 Worker 1** (`apps/worker`) | **AWS Valkey** | TCP (TLS / `rediss://`) | Consumes India probes (`XREADGROUP`), handles recovery (`XAUTOCLAIM`), ACKs (`XACK`) | `REGION="india"`, `REGION_ID="<uuid>"`, `WORKER_ID="worker-in-01"` |
| **EC2 Worker 2** (`apps/worker`) | **AWS Valkey** | TCP (TLS / `rediss://`) | Consumes US probes (`XREADGROUP`), handles recovery (`XAUTOCLAIM`), ACKs (`XACK`) | `REGION="us"`, `REGION_ID="<uuid>"`, `WORKER_ID="worker-us-01"` |
| **EC2 Workers** | **Target Websites** | HTTP / HTTPS | Executes regional network probes via `axios.get()` (10s timeout) | Egress internet access via NAT/IGW |
| **EC2 Workers** | **Neon PostgreSQL** | TCP (TLS) | Saves probe tick results (`response_time_ms`, status `Up`/`Down`) | `DATABASE_URL` with `?sslmode=require` |

---

## 3. Important AWS Networking & Security Rules

> [!IMPORTANT]
> **AWS ElastiCache Serverless Valkey is VPC-internal.**
> 1. **Vercel and Railway DO NOT need access to Valkey.** Only Pusher and Workers communicate with Valkey.
> 2. **Pusher & Workers VPC:**
>    - The Pusher EC2 instance should be launched in the same VPC and AWS Region as the Valkey cluster.
>    - In the Valkey Security Group, add an Inbound Rule allowing TCP port `6379` from the EC2 Security Group.
> 3. **Cross-Region Workers:**
>    - If Worker 2 is launched in a different AWS region (e.g., Valkey is in `ap-south-1` Mumbai and Worker 2 is in `us-east-1` N. Virginia), establish **AWS VPC Peering** between the two VPCs.
>    - Update VPC route tables to route traffic destined for the Valkey CIDR block across the peering connection.
>    - Add the peered VPC CIDR block to the Valkey Security Group inbound rules on port `6379`.

---

## 4. Step-by-Step Deployment Guide

### Phase 1: Database Setup & Region Seeding (Neon)

1. Obtain your PostgreSQL connection string from Neon:
   ```text
   postgresql://username:password@ep-example-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
2. Apply database migrations / Prisma push:
   ```bash
   cd packages/store
   pnpm prisma db push
   ```
3. Seed the `Region` table with the regions matching your workers:
   ```sql
   INSERT INTO "Region" ("id", "name")
   VALUES 
     ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'India'),
     ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'US')
   ON CONFLICT ("name") DO NOTHING;
   ```
   *(Note down the IDs; they are required for `REGION_ID` on the workers).*

---

### Phase 2: Deploy Backend API on Railway (`apps/api`)

Railway will run the Express.js REST API service.

1. **Create New Railway Project:**
   - Go to [Railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select `Upgrid`.
2. **Configure Service Settings:**
   - **Root Directory:** `/`
   - **Build Command:**
     ```bash
     pnpm --filter store run build && pnpm --filter api run build
     ```
   - **Start Command:**
     ```bash
     node apps/api/dist/index.js
     ```
3. **Set Environment Variables on Railway:**
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `PORT` | `3003` | Listening port for Express |
   | `DATABASE_URL` | `postgresql://...` | Neon PostgreSQL pooled URL with `?sslmode=require` |
   | `JWT_SECRET` | `<random-64-character-secret>` | Secret for signing JWT authentication tokens |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` | Restricts API access to your Vercel frontend domain |
4. **Generate Public Domain:**
   - Under **Settings** → **Networking**, click **Generate Domain** (e.g. `https://upgrid-api.up.railway.app`).
   - Copy this URL for the Vercel frontend.

---

### Phase 3: Deploy Frontend on Vercel (`apps/web`)

Vercel will host the Next.js frontend application.

1. **Import Project to Vercel:**
   - Go to [Vercel](https://vercel.com) → **Add New** → **Project** → select `Upgrid`.
2. **Configure Build Settings:**
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `.` (repository root)
   - **Build Command:** `pnpm turbo run build --filter=web`
   - **Output Directory:** `apps/web/.next`
   - **Install Command:** `pnpm install`
3. **Set Environment Variables on Vercel:**
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://upgrid-api.up.railway.app` | Railway API public domain from Phase 2 |
4. **Deploy:**
   - Click **Deploy**. Once built, your site will be live at `https://<your-project>.vercel.app`.

---

### Phase 4: Deploy Pusher Service on AWS EC2

Runs on a single small instance (e.g., `t4g.nano` or `t4g.micro`, Amazon Linux 2023) in the same VPC as Valkey.

1. **Build & Push Pusher Docker Image:**
   ```bash
   docker build -f Dockerfile.pusher -t ghcr.io/<your-github-user>/upgrid-pusher:latest .
   docker push ghcr.io/<your-github-user>/upgrid-pusher:latest
   ```
2. **On Pusher EC2 Instance:**
   ```bash
   # Install and enable Docker
   sudo dnf install -y docker
   sudo systemctl enable --now docker
   sudo usermod -aG docker ec2-user

   # Create environment file
   cat <<'EOF' > ~/.env.pusher
   REDIS_URL="rediss://your-valkey-cluster.serverless.aps1.cache.amazonaws.com:6379"
   DATABASE_URL="postgresql://username:password@ep-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
   PUSHER_INTERVAL_MS=120000
   PROBE_RETENTION_MS=900000
   EOF

   # Authenticate to GHCR
   echo "<GITHUB_PAT>" | docker login ghcr.io -u <GITHUB_USER> --password-stdin

   # Run container
   docker run -d \
     --name upgrid-pusher \
     --restart unless-stopped \
     --env-file ~/.env.pusher \
     ghcr.io/<your-github-user>/upgrid-pusher:latest
   ```
3. **Verify Pusher Logs:**
   ```bash
   docker logs -f upgrid-pusher
   # Expected output:
   # [Pusher] Starting Upgrid pusher service (interval: 120000ms, retention: 900000ms)...
   # [Pusher] Fetched X websites for probing
   # [Pusher] Probe batch dispatched successfully in 45ms
   ```

---

### Phase 5: Deploy 2 Regional Workers on AWS EC2

Deploy Worker 1 in Region 1 (e.g., India `ap-south-1`) and Worker 2 in Region 2 (e.g., US `us-east-1`).

1. **Build & Push Worker Docker Image:**
   ```bash
   docker build -f Dockerfile -t ghcr.io/<your-github-user>/upgrid-worker:latest .
   docker push ghcr.io/<your-github-user>/upgrid-worker:latest
   ```

2. **On Worker 1 EC2 Instance (India):**
   ```bash
   cat <<'EOF' > ~/.env.worker
   REDIS_URL="rediss://your-valkey-cluster.serverless.aps1.cache.amazonaws.com:6379"
   DATABASE_URL="postgresql://username:password@ep-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
   REGION="india"
   REGION_ID="a1b2c3d4-e5f6-7890-abcd-111111111111"
   WORKER_ID="worker-india-01"
   EOF

   docker run -d \
     --name upgrid-worker-india \
     --restart unless-stopped \
     --env-file ~/.env.worker \
     ghcr.io/<your-github-user>/upgrid-worker:latest
   ```

3. **On Worker 2 EC2 Instance (US):**
   ```bash
   cat <<'EOF' > ~/.env.worker
   REDIS_URL="rediss://your-valkey-cluster.serverless.aps1.cache.amazonaws.com:6379"
   DATABASE_URL="postgresql://username:password@ep-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
   REGION="us"
   REGION_ID="a1b2c3d4-e5f6-7890-abcd-222222222222"
   WORKER_ID="worker-us-01"
   EOF

   docker run -d \
     --name upgrid-worker-us \
     --restart unless-stopped \
     --env-file ~/.env.worker \
     ghcr.io/<your-github-user>/upgrid-worker:latest
   ```

4. **Verify Worker Logs:**
   ```bash
   docker logs -f upgrid-worker-india
   # Expected output:
   # Worker worker-india-01 listening on region india
   # [Worker worker-india-01] Processed 5 probes (5 acknowledged)
   ```

---

## 5. End-to-End Operational Lifecycle

```text
1. User registers monitor "https://my-app.com" on Vercel dashboard.
       ↓
2. Next.js fires POST /website to Railway API with Bearer token.
       ↓
3. Railway API persists the monitor record into Neon PostgreSQL.
       ↓
4. Every 2 minutes, EC2 Pusher queries Neon DB for active websites.
       ↓
5. Pusher writes the batch of probe tasks to AWS Valkey stream "upgrid:probes".
       ↓
6. Regional workers consume the batch concurrently:
   - India Worker (group: india-group) executes HTTP probe from India → saves website_tick in Neon → XACK
   - US Worker    (group: us-group)    executes HTTP probe from US    → saves website_tick in Neon → XACK
       ↓
7. Pusher runs safe stream cleanup (xTrimProbes) → evicts probes older than 15 minutes.
       ↓
8. User views dashboard on Vercel → fetches recent regional telemetry from Railway API → displays real-time uptime & latency charts.
```

---

## 6. Failure Recovery & Troubleshooting Cheatsheet

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **Worker logs `ECONNREFUSED` or hangs connecting to Valkey** | EC2 Security Group or VPC Peering issue | Check Security Group on Valkey allows port `6379` from EC2. Verify VPC peering route tables if worker is in a different AWS region. |
| **Worker crashes with Prisma client error** | Missing `DATABASE_URL` or SSL flag | Ensure `DATABASE_URL` contains `?sslmode=require` and points to the Neon connection pooler. |
| **Pusher pushing overlapping batches** | Overlap lock active | Pusher now has an in-flight guard (`isPushing`). Check logs to verify long-running queries; increase `PUSHER_INTERVAL_MS` if site catalog is massive. |
| **Vercel frontend displays Network Error on signup/login** | CORS origin blocked on Railway API | Ensure `CORS_ORIGIN` on Railway matches your exact Vercel frontend domain (`https://<project>.vercel.app`). |
| **Worker restarted mid-processing** | Automatic recovery (`XAUTOCLAIM`) | After 60 seconds of idle time, `xAutoClaim` will automatically claim the pending un-acked probe and process it. |
