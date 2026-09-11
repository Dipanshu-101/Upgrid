import { prismaClient } from 'store/client';
import { xAddBulk } from 'redisstream/client';

const DEFAULT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

function getPusherIntervalMs(): number {
  const envVal = process.env.PUSHER_INTERVAL_MS || process.env.PROBE_INTERVAL_MS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    console.warn(`[Pusher] Invalid interval '${envVal}', falling back to default of ${DEFAULT_INTERVAL_MS}ms`);
  }
  return DEFAULT_INTERVAL_MS;
}

const INTERVAL_MS = getPusherIntervalMs();
let isPushing = false;
let isShuttingDown = false;
let timer: NodeJS.Timeout | null = null;

async function pushProbeBatch(): Promise<void> {
  if (isPushing) {
    console.warn('[Pusher] Previous probe batch is still running; skipping tick to avoid duplicate/overlapping dispatch.');
    return;
  }
  if (isShuttingDown) {
    return;
  }

  isPushing = true;
  const startTime = Date.now();
  try {
    const websites = await prismaClient.website.findMany({
      select: {
        url: true,
        id: true,
      },
    });
    console.log(`[Pusher] Fetched ${websites.length} websites for probing`);
    if (websites.length > 0) {
      await xAddBulk(websites);
    }
    console.log(`[Pusher] Probe batch dispatched successfully in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('[Pusher] Error during probe dispatch cycle:', error);
  } finally {
    isPushing = false;
  }
}

console.log(`[Pusher] Starting Upgrid pusher service (interval: ${INTERVAL_MS}ms / ${(INTERVAL_MS / 1000).toFixed(1)}s)...`);

// Initial probe batch on startup
void pushProbeBatch();

// Schedule recurring batches every 2 minutes (or configured interval)
timer = setInterval(() => {
  void pushProbeBatch();
}, INTERVAL_MS);

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
