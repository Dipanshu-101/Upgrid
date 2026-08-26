# Uptime Monitoring Platform

A distributed, fault-tolerant uptime monitoring system designed to monitor websites from multiple regions, process large volumes of monitoring probes, and notify website owners when failures are detected.

The project is designed as a learning-focused DevOps/distributed-systems project, with emphasis on **horizontal scalability, reliable job processing, fault tolerance, observability, containerization, and Kubernetes-based deployment**.

---

## Architecture Overview

The platform is built around a producer/consumer architecture:

```text
                         ┌─────────────────────┐
                         │       Browser       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Node.js API      │
                         │   Backend Service   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      Database       │
                         │ Website + Monitor   │
                         │      Metadata       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Probe Publisher   │
                         │    / Scheduler      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │       Probe Queue            │
                    │  Pending monitoring jobs     │
                    └──────────────┬───────────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
                  ▼                ▼                ▼
             ┌─────────┐      ┌─────────┐      ┌─────────┐
             │ Worker 1│      │ Worker 2│      │ Worker N│
             └────┬────┘      └────┬────┘      └────┬────┘
                  │                │                │
                  └────────────────┼────────────────┘
                                   │
                              HTTP Probes
                                   │
                                   ▼
                              Target Website
```

The system can later be deployed across multiple geographic regions:

```text
                         Global Monitoring System
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
          India Region        USA Region          Nigeria Region
              │                   │                   │
          Worker Pool         Worker Pool          Worker Pool
              │                   │                   │
              ▼                   ▼                   ▼
          HTTP Probes         HTTP Probes          HTTP Probes
```

---

# Core Workflow

## 1. Website Registration

A user registers a website through the Node.js backend.

Example:

```text
POST /monitors

{
  "url": "https://example.com",
  "interval": 60,
  "regions": ["india", "usa"]
}
```

The backend stores the monitor configuration in the database.

The database is the persistent source of truth for:

- Website URL
- Owner
- Monitoring interval
- Enabled regions
- Current status
- Last check
- Next scheduled check
- Failure information
- Notification configuration

---

## 2. Probe Publishing

A dedicated **Publisher/Scheduler** reads monitors that are due for checking.

Instead of creating millions of independent `setInterval()` timers, the publisher converts due monitors into short-lived monitoring jobs called **probes**.

```text
Database
   │
   │ monitors due for check
   ▼
Publisher
   │
   ▼
Probe Queue
```

Example probe:

```json
{
  "probeId": "probe_123",
  "monitorId": "monitor_456",
  "url": "https://example.com",
  "region": "india",
  "scheduledAt": "2026-08-26T12:00:00Z",
  "timeout": 5000
}
```

This separates **scheduling** from **execution**.

---

# 3. Probe Queue

The probe queue contains jobs waiting to be processed.

```text
                  Probe Queue
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Worker 1     Worker 2     Worker N
```

Workers pull batches of probes from the queue.

The number of workers can be scaled horizontally based on workload.

Possible scaling signals include:

- Queue depth
- Queue processing latency
- Number of due monitors
- CPU/memory utilization
- Probe completion rate

This makes the worker layer independently scalable from the API layer.

---

# 4. In-Flight / Acknowledgement Queue

When a worker receives a probe, the job should not immediately disappear from the reliability model.

Conceptually:

```text
Pending Queue
      │
      │ Worker claims job
      ▼
In-Flight / Processing State
      │
      ├── ACK → remove/complete
      │
      └── Worker dies → job becomes eligible again
```

The worker acknowledges the probe only after it has successfully completed the monitoring operation and persisted the result.

This provides **at-least-once processing semantics**.

### Why this matters

Consider:

```text
Worker 1
   │
   ├── receives probe
   │
   ├── checks website
   │
   └── 💥 crashes before ACK
```

The probe must not be permanently lost.

Instead, after its visibility/lease timeout expires:

```text
Probe
  │
  └── becomes available again
          │
          ▼
       Worker 2
```

The processing layer therefore needs a visibility timeout / lease mechanism rather than relying only on an ordinary queue with permanent deletion.

---

# 5. Short-Lived Probe Batches

Monitoring jobs are intentionally short-lived.

A probe batch has a limited lifetime/processing window.

The planned system uses a short TTL window (currently around **3 minutes**) for transient probe queues/batches.

After the window expires, stale transient jobs are flushed or discarded because a fresh monitoring cycle will generate new probes.

```text
T = 0
 │
 ▼
New probe batch
 │
 │  Worker processing
 │
 ▼
T = 3 minutes
 │
 ▼
Stale transient jobs expire
 │
 ▼
Next monitoring cycle creates fresh probes
```

The exact TTL should be configurable rather than hard-coded.

> Important: the persistent database remains the source of truth. Queue TTL is for transient work, not permanent monitor state or historical monitoring results.

---

# 6. Worker Processing

Workers perform the actual HTTP monitoring.

A worker:

1. Receives a probe.
2. Validates the probe.
3. Performs an HTTP/HTTPS request.
4. Applies a timeout.
5. Measures response latency.
6. Determines the result.
7. Persists the result.
8. ACKs the probe.
9. Publishes a notification event when necessary.

Example:

```text
Probe
 │
 ▼
Worker
 │
 ├── DNS
 ├── TCP/TLS
 ├── HTTP request
 ├── Response status
 ├── Response latency
 └── Timeout handling
 │
 ▼
Monitoring Result
```

Possible results:

```text
UP
DOWN
TIMEOUT
DNS_ERROR
TLS_ERROR
HTTP_ERROR
```

---

# 7. Failure / Notification Queue

When a worker detects a failure, it should not directly send every notification itself.

Instead, it publishes a notification event:

```text
Worker
  │
  │ website DOWN
  ▼
Notification Queue
  │
  ├───────────────┬────────────────┐
  ▼               ▼                ▼
Email Worker   WhatsApp Worker   Other Worker
```

Example event:

```json
{
  "eventId": "event_789",
  "monitorId": "monitor_456",
  "probeId": "probe_123",
  "url": "https://example.com",
  "region": "india",
  "status": "DOWN",
  "latency": null,
  "error": "TIMEOUT",
  "timestamp": "2026-08-26T12:01:00Z"
}
```

This decouples monitoring from notification delivery.

If an email provider is slow:

```text
Email provider slow
       ↓
Monitoring workers continue working
```

The notification system can retry independently.

---

# 8. Notification Fan-Out

The notification queue can support multiple delivery mechanisms:

```text
                    Notification Queue
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Email            WhatsApp          Webhook
       Worker            Worker            Worker
          │                │                │
          ▼                ▼                ▼
       Provider         Provider          Customer
```

Future integrations can be added without modifying the core monitoring workers.

Possible notification channels:

- Email
- WhatsApp
- SMS
- Slack
- Discord
- Webhooks
- Push notifications

---

# 9. Failure Recovery

A major design goal is avoiding lost monitoring jobs.

```text
                    Probe Queue
                         │
                         ▼
                     Worker A
                         │
                    processing
                         │
                         X
                       crash
                         │
                         ▼
                Lease / Visibility Timeout
                         │
                         ▼
                     Worker B
                         │
                         ▼
                     Process
                         │
                         ▼
                       ACK
```

This gives the system resilience against worker crashes.

Because processing can be **at-least-once**, every probe/result operation should be designed to be **idempotent**.

For example, a result can be uniquely identified using:

```text
probeId + monitorId + scheduledAt + region
```

so a retry does not create an incorrect duplicate state.

---

# 10. Horizontal Scaling

The worker layer is designed to scale independently.

```text
Small workload

Queue
 │
 ├── Worker 1
 └── Worker 2
```

Under increased load:

```text
Queue
 │
 ├── Worker 1
 ├── Worker 2
 ├── Worker 3
 ├── Worker 4
 ├── ...
 └── Worker N
```

Worker count can be controlled by queue depth and processing pressure.

A Kubernetes deployment can later use an autoscaling mechanism such as:

```text
Queue depth
    │
    ▼
Autoscaler
    │
    ├── Scale up → more workers
    │
    └── Scale down → fewer workers
```

The goal is to prevent a single Node.js process/event loop from becoming the scheduling and processing bottleneck.

---

# 11. Regional Monitoring

A major feature of the platform is **multi-region monitoring**.

A website may be:

```text
India      → UP     120 ms
USA        → UP      80 ms
Nigeria    → DOWN   timeout
```

Therefore, one global probe is not enough.

The same monitor can generate region-specific probes:

```text
Monitor
   │
   ├── India probe
   ├── USA probe
   └── Nigeria probe
```

This allows the platform to identify regional outages and latency differences.

---

# 12. Smart Failure Detection

A single failed HTTP request should not necessarily trigger an outage alert.

The platform can use a failure threshold:

```text
Attempt 1 → DOWN
Attempt 2 → DOWN
Attempt 3 → DOWN
              │
              ▼
        Confirmed outage
              │
              ▼
        Notification
```

Similarly, recovery can require a successful confirmation:

```text
DOWN
 │
 ├── check → UP
 ├── check → UP
 └── check → UP
       │
       ▼
  Recovery confirmed
       │
       ▼
 Recovery notification
```

This helps prevent alert storms caused by transient network failures.

---

# 13. Deduplication / Alert State

Another planned layer is an **alert state machine**.

Instead of sending an alert every time a probe fails:

```text
DOWN
DOWN
DOWN
DOWN
DOWN
```

the system tracks:

```text
HEALTHY
   │
   ▼
SUSPECT
   │
   ▼
DOWN
   │
   ▼
RECOVERING
   │
   ▼
HEALTHY
```

Notifications are generated on meaningful state transitions:

```text
HEALTHY → DOWN
DOWN → HEALTHY
```

rather than every individual failed probe.

This prevents notification spam.

---

# 14. Observability

The monitoring platform should also monitor itself.

Recommended metrics:

```text
probe_queue_depth
probe_processing_latency
probe_success_rate
probe_failure_rate
worker_count
worker_error_rate
notification_queue_depth
notification_delivery_rate
scheduler_lag
database_latency
```

Example observability stack:

```text
Application
    │
    ├── Metrics ───────► Prometheus
    │                       │
    │                       ▼
    │                    Grafana
    │
    └── Logs ───────────► Log aggregation
```

A particularly useful metric is:

```text
scheduler_lag =
actual_execution_time - scheduled_execution_time
```

This shows whether the monitoring system itself is falling behind.

---

# 15. Kubernetes Deployment

The intended deployment model is containerized and Kubernetes-ready.

```text
Kubernetes Cluster
│
├── API Deployment
│
├── Scheduler Deployment
│
├── Probe Worker Deployment
│
├── Notification Worker Deployment
│
├── Database
│
├── Queue / Broker
│
├── Ingress
│
└── Monitoring Stack
```

Workers can be scaled independently from API servers.

Example:

```bash
kubectl scale deployment probe-worker --replicas=10
```

The eventual goal is to use autoscaling based on workload rather than manually selecting a fixed worker count.

---

# Design Principles

The project follows several distributed-system principles:

### Loose Coupling

The API, scheduler, probe workers, and notification workers communicate through queues rather than tightly depending on each other.

### Horizontal Scalability

More workload can be handled by adding more workers rather than continuously increasing the size of a single process.

### Fault Tolerance

A worker failure should not permanently lose a monitoring job.

### At-Least-Once Processing

A job may be processed more than once during failure recovery, so operations are designed to be idempotent.

### Backpressure

Queues provide a buffer when incoming work temporarily exceeds worker capacity.

### Regional Isolation

Monitoring workers can operate independently in different geographic regions.

### Observability

The system exposes metrics and logs to understand both website health and the health of the monitoring platform itself.

---

# High-Level Data Flow

```text
                    ┌──────────────┐
                    │    User      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Node.js API │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    └──────┬───────┘
                           │
                    monitors due
                           │
                           ▼
                    ┌──────────────┐
                    │   Publisher  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Probe Queue │
                    └──────┬───────┘
                           │
                 ┌─────────┼─────────┐
                 ▼         ▼         ▼
              Worker    Worker    Worker
                 │         │         │
                 └─────────┼─────────┘
                           │
                           ▼
                    Target Websites
                           │
                           ▼
                    Monitoring Result
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
         Results DB              Failure Event
                                        │
                                        ▼
                               Notification Queue
                                        │
                         ┌──────────────┼──────────────┐
                         ▼              ▼              ▼
                       Email         WhatsApp       Webhook
```

---

# Why Not Just `setInterval()`?

A simple implementation could use:

```js
setInterval(() => {
  // check websites
}, 60_000);
```

This works for a small monitoring application.

At large scale, however, a centralized timer-based approach introduces problems:

- One process becomes responsible for a very large amount of scheduling work.
- Timers execute only when the Node.js event loop gets an opportunity to run them.
- Slow processing can cause overlapping monitoring cycles.
- A process crash can lose in-memory scheduling state.
- There is no natural backpressure mechanism.
- Work cannot be redistributed easily when a worker fails.
- Horizontal scaling becomes more complicated.
- Regional worker pools are harder to manage.

The proposed architecture instead treats each monitoring check as a distributed job.

```text
Timer-based approach:

setInterval
     │
     ▼
Huge batch of work
     │
     ▼
Single scheduling bottleneck


Distributed approach:

Persistent monitor state
     │
     ▼
Scheduler / Publisher
     │
     ▼
Queue
     │
     ▼
Horizontally scalable workers
```

`setInterval()` may still be used internally for small scheduler loops, but it is not treated as the source of truth for millions of monitoring jobs.

---

# Technology Stack

The exact technologies are intentionally modular.

### Backend

- Node.js
- Express / Fastify

### Database

- PostgreSQL

### Queue / Messaging

Potential options:

- Redis Streams
- RabbitMQ
- Kafka
- Amazon SQS

The queue implementation may change during development based on the scalability and reliability requirements.

### Containerization

- Docker

### Orchestration

- Kubernetes

### CI/CD

- GitHub Actions

### Cloud

- AWS

### Observability

- Prometheus
- Grafana

---

# Project Goals

The primary goal is not only to build an uptime checker, but to understand how a distributed monitoring platform can be designed and operated.

Key goals:

- [ ] Build Node.js API
- [ ] Store monitor configuration in PostgreSQL
- [ ] Implement scheduler/publisher
- [ ] Implement probe queue
- [ ] Implement probe workers
- [ ] Implement acknowledgement / visibility timeout
- [ ] Implement worker failure recovery
- [ ] Store monitoring results
- [ ] Implement notification queue
- [ ] Implement email notifications
- [ ] Implement alert state machine
- [ ] Implement regional workers
- [ ] Dockerize services
- [ ] Create Kubernetes manifests
- [ ] Implement CI/CD
- [ ] Add Prometheus metrics
- [ ] Add Grafana dashboards
- [ ] Implement worker autoscaling
- [ ] Load test the system
- [ ] Measure scheduler lag and probe throughput

---

# Important Design Note

The architecture intentionally separates:

```text
Scheduling
    ≠
Job transport
    ≠
Job execution
    ≠
Result persistence
    ≠
Notification delivery
```

This separation allows each component to scale and fail independently.

The long-term objective is to evolve the project from a simple uptime checker into a **distributed, fault-tolerant, multi-region monitoring platform** capable of demonstrating real-world DevOps and distributed-systems concepts.

---

# Project Status

🚧 **Currently in architecture/design phase**

The implementation will evolve incrementally, starting with a local single-region version and progressing toward:

```text
Local
  ↓
Docker Compose
  ↓
Kubernetes
  ↓
Horizontal workers
  ↓
Queue-based processing
  ↓
Autoscaling
  ↓
Multi-region monitoring
  ↓
Production-style observability
```

---

## Learning Focus

This project is primarily intended to explore:

- Distributed job processing
- Queue-based architectures
- Fault tolerance
- At-least-once delivery
- Idempotency
- Backpressure
- Horizontal scaling
- Kubernetes workloads
- Autoscaling
- Multi-region systems
- Observability
- CI/CD
- Docker
- Cloud infrastructure

