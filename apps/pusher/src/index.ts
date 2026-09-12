import { prismaClient } from 'store/client';
import { DEFAULT_PROBE_RETENTION_MS, WebsiteEvent, xAddBulk, xTrimProbes } from 'redisstream/client';

const SCHEDULER_TICK_MS = process.env.PUSHER_TICK_MS ? parseInt(process.env.PUSHER_TICK_MS, 10) : 5000; // Check every 5s

function getRetentionMs(): number {
  const envVal = process.env.PROBE_RETENTION_MS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    console.warn(`[Pusher] Invalid retention '${envVal}', falling back to default of ${DEFAULT_PROBE_RETENTION_MS}ms`);
  }
  return DEFAULT_PROBE_RETENTION_MS;
}

const RETENTION_MS = getRetentionMs();
let isPushing = false;
let isShuttingDown = false;
let timer: NodeJS.Timeout | null = null;

async function runSchedulerTick(): Promise<void> {
  if (isPushing) {
    return;
  }
  if (isShuttingDown) {
    return;
  }

  isPushing = true;
  const startTime = Date.now();
  try {
    const allDbRegions = await prismaClient.region.findMany();
    const websites = await prismaClient.website.findMany({
      include: {
        regions: true,
      },
    });

    const now = Date.now();
    const dueWebsites: typeof websites = [];
    const eventsToDispatch: WebsiteEvent[] = [];

    for (const site of websites) {
      const intervalSec = site.interval && site.interval > 0 ? site.interval : 180;
      const intervalMs = intervalSec * 1000;
      const lastProbedMs = site.lastProbedAt ? site.lastProbedAt.getTime() : 0;

      if (now - lastProbedMs >= intervalMs) {
        dueWebsites.push(site);

        // Determine target regions
        const activeRegions = site.regions && site.regions.length > 0 ? site.regions : allDbRegions;
        const targetRegionIdentifiers = [
          ...activeRegions.map((r) => r.id),
          ...activeRegions.map((r) => r.name.toLowerCase()),
        ];

        eventsToDispatch.push({
          url: site.url,
          id: site.id,
          regions: JSON.stringify(targetRegionIdentifiers),
          interval: intervalSec,
        });
      }
    }

    if (eventsToDispatch.length > 0) {
      console.log(`[Pusher] Dispatching ${eventsToDispatch.length} due monitors across regions (total registered: ${websites.length})`);
      await xAddBulk(eventsToDispatch);

      const dispatchTimestamp = new Date();
      await prismaClient.website.updateMany({
        where: {
          id: {
            in: dueWebsites.map((w) => w.id),
          },
        },
        data: {
          lastProbedAt: dispatchTimestamp,
        },
      });
      console.log(`[Pusher] Probe batch dispatched and timestamps updated in ${Date.now() - startTime}ms`);
    }

    // Evict probes older than retention window across streams
    try {
      const trimmed = await xTrimProbes(RETENTION_MS);
      if (trimmed > 0) {
        console.log(`[Pusher] Evicted ${trimmed} expired stream entries (> ${RETENTION_MS / 60000}m old)`);
      }
    } catch (trimError) {
      console.warn('[Pusher] Warning: Failed to trim old stream entries:', trimError);
    }
  } catch (error) {
    console.error('[Pusher] Error during probe dispatch cycle:', error);
  } finally {
    isPushing = false;
  }
}

console.log(`[Pusher] Starting Upgrid dynamic scheduler service (tick resolution: ${SCHEDULER_TICK_MS}ms, retention: ${RETENTION_MS}ms)...`);

// Initial probe tick
void runSchedulerTick();

// Recurring scheduler tick
timer = setInterval(() => {
  void runSchedulerTick();
}, SCHEDULER_TICK_MS);

function handleShutdown(signal: string) {
  console.log(`[Pusher] Received ${signal}. Shutting down cleanly...`);
  isShuttingDown = true;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

