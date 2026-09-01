# Upgrid - Codebase Architecture & Technical Summary

## 1. Executive Summary

**Upgrid** is a distributed, fault-tolerant uptime and website performance monitoring platform. Built as a high-throughput producer/consumer system, Upgrid periodically executes regional HTTP probes across registered target websites, measures latency and availability, and persists performance telemetry for analysis and alerting.

The project is structured as a **Turborepo** monorepo using **pnpm** workspaces, separating concerns across modular services (API, Scheduler/Pusher, Regional Worker pool, and Frontend Web) and shared libraries (Database Store, Redis Stream Queue, Shared UI).

---

## 2. Monorepo Structure

```text
Upgrid/
├── apps/
│   ├── api/          # Express REST API (Auth, Monitor Management, Swagger docs)
│   ├── pusher/       # Probe Scheduler / Dispatcher (Pushes checks to Redis Streams)
│   ├── worker/       # Regional Probe Workers (Executes HTTP probes, records ticks)
│   ├── web/          # Next.js App Router Web UI
│   └── tests/        # Integration test suite (Vitest + Axios)
├── packages/
│   ├── store/        # Prisma ORM client & PostgreSQL database schema
│   ├── redisstream/  # Redis Streams abstraction (XADD, XREADGROUP, XACK)
│   ├── ui/           # Shared React UI component library
│   ├── typescript-config/ # Shared tsconfig configurations
│   └── eslint-config/     # Shared ESLint rules
├── turbo.json        # Turborepo task pipeline
└── package.json      # Workspace root package configuration
```

---

## 3. High-Level Architecture & Data Flow

```text
               ┌────────────────────────┐
               │    Next.js Web UI      │
               └───────────┬────────────┘
                           │ (HTTP / JWT)
                           ▼
               ┌────────────────────────┐
               │     Express API        │
               └───────────┬────────────┘
                           │
                           ▼
          ┌──────────────────────────────────┐
          │  PostgreSQL Database (Prisma)    │
          │  • Users                         │
          │  • Websites                      │
          │  • Regions                       │
          │  • website_ticks (Telemetry)     │
          └───────────────▲──────────────────┘
                          │
          ┌───────────────┴──────────────────┐
          │                                  │
          │ (Reads Active Websites)          │ (Writes probe tick results)
          │                                  │
┌─────────────────────┐            ┌─────────────────────┐
│    Pusher App       │            │   Worker App Pool   │
│ (Periodic Poller)   │            │  (Region: ID, ...)  │
└──────────┬──────────┘            └──────────▲──────────┘
           │                                  │
           │ XADD                             │ XREADGROUP & XACK
           ▼                                  │
┌─────────────────────────────────────────────┴──────────┐
│              Redis Stream (`upgrid:website`)            │
│  Message payload: { id: websiteId, url: targetUrl }    │
└────────────────────────────────────────────────────────┘
```

### End-to-End Workflow:
1. **User Onboarding & Monitor Creation:** Users sign up / log in via `/user/signup` and `/user/signin` on `apps/api` to obtain a JWT. Users register websites with `POST /website`.
2. **Scheduled Probe Dispatch (`apps/pusher`):** At periodic intervals (e.g. every 3 minutes), the Pusher service fetches all registered websites from PostgreSQL and publishes monitoring tasks (`WebsiteEvent: { url, id }`) into Redis Stream `upgrid:website` via `xAddBulk`.
3. **Regional Worker Consumption (`apps/worker`):** Workers configured with a specific `REGION_ID` and `WORKER_ID` read pending probe batches using consumer groups (`xReadGroup`).
4. **Execution & Telemetry Recording:** Workers execute parallel HTTP GET requests using `axios` against the URLs, calculate latency (`response_time_ms`), evaluate status (`Up` or `Down`), write a `website_tick` record directly into PostgreSQL, and acknowledge the stream message (`xAckBulk`).
5. **Observability & Status Query:** The API exposes `GET /status/:websiteId` and `GET /websites`, returning recent tick telemetry and latency data.

---

## 4. Component Details

### 4.1. `apps/api` (REST API Service)
- **Framework:** Express.js, TypeScript.
- **Port:** Default `3003` (configurable via `process.env.PORT`).
- **Authentication:** JWT bearer tokens signed with `JWT_SECRET`.
- **API Documentation:** Interactive Swagger UI mounted at `/api-docs`.
- **Key Endpoints:**
  - `POST /user/signup` — Validates credentials using Zod, creates a user in PostgreSQL.
  - `POST /user/signin` — Authenticates user, issues JWT token.
  - `POST /website` — (Protected) Creates a new monitored website entry for authenticated user.
  - `GET /websites` — (Protected) Lists all websites owned by the user, including the latest 10 ticks.
  - `GET /status/:websiteId` — (Protected) Retrieves website details and the 10 most recent health ticks.

### 4.2. `apps/pusher` (Probe Scheduler)
- **Role:** Independent cron/timer daemon that decouples scheduling from probe execution.
- **Cycle:** Triggers every 3 minutes (`setInterval`).
- **Logic:** Queries all active website URLs from `packages/store` and pushes them into Redis Stream `upgrid:website` via `xAddBulk`.

### 4.3. `apps/worker` (Regional Probe Worker)
- **Role:** Consumer process executing regional network checks.
- **Configuration (Env Vars):**
  - `REGION_ID`: Identifier for the deployment region (links to `Region` table in PostgreSQL).
  - `WORKER_ID`: Unique consumer identifier within the Redis consumer group.
- **Processing Loop:**
  - Continuously executes `xReadGroup` in an infinite loop.
  - Fires concurrent HTTP GET probes via `axios.get(url)`.
  - Calculates response duration `Date.now() - startTime`.
  - Records result (`website_tick` row with status `Up` / `Down` and `response_time_ms`).
  - Calls `xAckBulk` to confirm job completion.

### 4.4. `packages/store` (Database Layer)
- **ORM:** Prisma v7 with `@prisma/adapter-pg` and PostgreSQL datasource.
- **Schema Entities:**
  - `User`: `id` (cuid), `username` (unique), `password`, relation to `Website[]`.
  - `Website`: `id` (cuid), `url`, `userId`, `timeAdded`, relation to `website_tick[]`.
  - `Region`: `id` (cuid), `name`, relation to `website_tick[]`.
  - `website_tick`: `id` (uuid), `response_time_ms` (Int), `status` (Enum: `Up`, `Down`, `Unknown`), `region_id`, `website_id`, `createdAt` (timestamp).

### 4.5. `packages/redisstream` (Queue & Messaging)
- **Client:** `redis` (node-redis v4).
- **Stream Key:** `upgrid:website`.
- **Functions:**
  - `xAddBulk(websites)`: Adds entries into the stream with auto-generated message IDs (`*`).
  - `xReadGroup(consumerGroup, workerId)`: Reads batch of pending messages (batch size: 5) for a consumer group using `>`.
  - `xAckBulk(consumerGroup, eventIds)`: Acknowledges processed messages.

### 4.6. `apps/web` (Frontend Web Application)
- **Framework:** Next.js 16 (App Router), React 19, CSS Modules.
- **Purpose:** Dashboard UI for users to monitor targets, view regional metrics, uptime history, and manage settings.

### 4.7. `apps/tests` (Integration Tests)
- **Framework:** Vitest + Axios.
- **Coverage:** User signup/signin validation, authenticated website creation, isolation / 404 testing when querying another user's monitor.

---

## 5. Technology Stack Summary

| Layer | Technologies |
| :--- | :--- |
| **Monorepo Engine** | Turborepo, pnpm (v11.23.0), Node.js (>=24) |
| **Backend Services** | Node.js, Express.js, TypeScript, Zod |
| **Frontend** | Next.js (App Router), React, CSS Modules |
| **Database & ORM** | PostgreSQL, Prisma ORM, `@prisma/adapter-pg` |
| **Message Broker** | Redis Streams (`XADD`, `XREADGROUP`, `XACK`) |
| **HTTP Client** | Axios |
| **Testing** | Vitest |
| **Documentation** | Swagger / OpenAPI (`swagger-ui-express`, `swagger-jsdoc`) |

---

## 6. Environment Variables Guide

| Variable | Target App/Package | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `packages/store`, `apps/api`, `apps/pusher`, `apps/worker` | PostgreSQL connection string |
| `JWT_SECRET` | `apps/api` | Secret key for signing and verifying JWT tokens |
| `PORT` | `apps/api` | API listening port (default: 3003) |
| `REDIS_URL` | `packages/redisstream` | Connection string for Redis instance (default: localhost:6379) |
| `REGION_ID` | `apps/worker` | Region identifier for probe worker metrics |
| `WORKER_ID` | `apps/worker` | Unique consumer name in Redis consumer group |

---

## 7. Key Scripts & Running the Workspace

```bash
# Install dependencies across all packages
pnpm install

# Run database migrations / Prisma generate
cd packages/store && pnpm prisma generate

# Start all applications concurrently in development mode
pnpm dev

# Build all packages and applications
pnpm build

# Run linting
pnpm lint

# Run integration tests
pnpm --filter tests test
```
