<div align="center">

# 📡 Uptime Monitoring Platform


 [Dashboard Preview](C:\Users\lenovo\Upgrid\packages\assest\dashboard-preview.png)

**A distributed, fault-tolerant system for monitoring website uptime across multiple regions.**

</div>

---

## Overview

Most uptime checkers are a `setInterval()` loop pinging a list of URLs. That breaks down fast — one crash loses your scheduling state, one slow provider blocks every check, and there's no way to scale beyond a single process.

This platform is built differently. It treats every health check as an independent, queued job rather than a timer callback, so monitoring, execution, and alerting can each scale and fail on their own.

```
Monitors → Scheduler → Probe Queue → Workers → Results → Alerting
```

## Why a Queue Instead of `setInterval()`

| `setInterval()` | This Platform |
|---|---|
| Single process owns all scheduling | Scheduling, execution, and delivery are decoupled |
| Crash = lost in-memory state | Unacknowledged jobs are automatically retried |
| No backpressure | Queue absorbs load spikes |
| Hard to scale horizontally | Workers scale independently, by region |

## How It Works

1. **Register** a monitor (`URL`, `interval`, target `regions`) via the API — persisted in PostgreSQL as the source of truth.
2. **Schedule** — a publisher converts due monitors into short-lived probe jobs and pushes them to a queue.
3. **Execute** — a horizontally scalable pool of workers claims probes, performs the HTTP check, and records latency/status.
4. **Recover** — probes use a visibility timeout, so a worker crash returns the job to the queue instead of losing it (at-least-once, idempotent processing).
5. **Alert** — failures pass through a state machine (`HEALTHY → SUSPECT → DOWN → RECOVERING`) so notifications fire on real state changes, not every failed ping.
6. **Notify** — a decoupled notification queue fans out to email, WhatsApp, Slack, and webhooks without blocking monitoring workers.

## Key Design Decisions

- **At-least-once delivery** — every probe/result is idempotent, so retries never corrupt state.
- **Regional isolation** — one monitor can spawn probes in multiple regions to detect localized outages.
- **Failure thresholds, not single-ping alerts** — prevents alert storms from transient blips.
- **Self-observability** — the platform tracks its own health (`scheduler_lag`, queue depth, worker error rate) via Prometheus + Grafana.

## Tech Stack

| Layer | Technology |
|---|---|
| API | Node.js (Express/Fastify) |
| Database | PostgreSQL |
| Queue | Redis Streams / RabbitMQ / Kafka *(pluggable)* |
| Orchestration | Docker → Kubernetes |
| Observability | Prometheus + Grafana |
| CI/CD | GitHub Actions |
| Cloud | AWS |

## Project Status

🚧 **Architecture & design phase.** Implementation is progressing incrementally:

```
Local → Docker Compose → Kubernetes → Queue-based Workers → Autoscaling → Multi-region
```

## Learning Focus

This project exists to explore distributed systems in practice — queue-based job processing, fault tolerance, backpressure, horizontal scaling, and Kubernetes-native deployment — not just to check if a website is up.

---

<div align="center">
<sub>Built as a hands-on exploration of distributed systems and DevOps engineering.</sub>
</div>
