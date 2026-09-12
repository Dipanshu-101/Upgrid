import 'dotenv/config';
import { xAckBulk, xAutoClaim, xReadGroup } from 'redisstream/client';
import { prismaClient } from 'store/client';
import axios from 'axios';

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} environment variable must be set`);
    }
    return value;
}

const REGION_ID = getRequiredEnv('REGION_ID');
const REGION = getRequiredEnv('REGION').trim().toLowerCase();
const WORKER_ID = getRequiredEnv('WORKER_ID');
const PROBE_TIMEOUT_MS = 10_000;

console.log(`Worker ${WORKER_ID} listening on region ${REGION}`);

let isRunning = true;

async function main() {
    let claimCursor = '0-0';

    while (isRunning) {
        try {
            // First check for any pending messages to recover
            const claimed = await xAutoClaim(REGION, WORKER_ID, 60_000, claimCursor);
            claimCursor = claimed.nextId;

            const response = claimed.messages.length > 0
                ? claimed.messages
                : await xReadGroup(REGION, WORKER_ID);

            if (!response || response.length === 0) {
                continue;
            }

            // Process probes concurrently
            const probeResults = await Promise.all(
                response.map(({ id, message }) => processProbe(id, message.url, message.id, message.regions))
            );

            // Only acknowledge probes whose telemetry was successfully handled or skipped
            const successfulAcks = probeResults.filter((id): id is string => id !== null);

            if (successfulAcks.length > 0) {
                await xAckBulk(REGION, successfulAcks);
            }

            console.log(`[Worker ${WORKER_ID}] Handled ${response.length} probes (${successfulAcks.length} acknowledged)`);
        } catch (loopError) {
            console.error(`[Worker ${WORKER_ID}] Error in worker processing loop:`, loopError);
            if (!isRunning) break;
            // Brief backoff on unexpected loop errors to avoid hot loop
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    console.log(`[Worker ${WORKER_ID}] Worker shutdown completed.`);
}

async function processProbe(
    streamMessageId: string,
    url: string,
    websiteId: string,
    regionsPayload?: string,
): Promise<string | null> {
    // If target regions are specified in the event, verify that this worker's region is selected
    if (regionsPayload) {
        let isRegionSelected = false;
        try {
            const parsed = JSON.parse(regionsPayload);
            if (Array.isArray(parsed)) {
                const lowerParsed = parsed.map((item) => String(item).toLowerCase());
                isRegionSelected = lowerParsed.includes(REGION_ID.toLowerCase()) || lowerParsed.includes(REGION.toLowerCase());
            }
        } catch {
            const list = regionsPayload.split(',').map((item) => item.trim().toLowerCase());
            isRegionSelected = list.includes(REGION_ID.toLowerCase()) || list.includes(REGION.toLowerCase());
        }

        if (!isRegionSelected) {
            // Region is not selected for this monitor; skip network probe and ACK message
            return streamMessageId;
        }
    }

    const startTime = Date.now();
    let status: "Up" | "Down" = "Up";

    try {
        await axios.get(url, { timeout: PROBE_TIMEOUT_MS });
    } catch {
        status = "Down";
    }

    const responseTimeMs = Date.now() - startTime;

    try {
        await prismaClient.website_tick.create({
            data: {
                response_time_ms: responseTimeMs,
                status,
                region_id: REGION_ID,
                website_id: websiteId,
            },
        });
        return streamMessageId;
    } catch (dbError) {
        console.error(`[Worker ${WORKER_ID}] Failed to persist website_tick for website ${websiteId}:`, dbError);
        // Do not return streamMessageId so it remains in PEL for recovery
        return null;
    }
}

function handleShutdown(signal: string) {
    console.log(`[Worker ${WORKER_ID}] Received ${signal}, shutting down gracefully...`);
    isRunning = false;
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

main().catch((error) => {
    console.error('Worker stopped:', error);
    process.exitCode = 1;
});