import { createClient } from "redis";
import { DEFAULT_PROBE_RETENTION_MS, getProbeMinId, getRegionConsumerGroup, PROBE_STREAM } from './contract.js';

export { DEFAULT_PROBE_RETENTION_MS, getProbeMinId, getRegionConsumerGroup, PROBE_STREAM } from './contract.js';

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
const redisUsername = process.env.REDIS_USERNAME || undefined;
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisTls = process.env.REDIS_TLS === 'true' || process.env.REDIS_USE_TLS === 'true';

const clientOptions: Parameters<typeof createClient>[0] = {};

if (process.env.REDIS_URL) {
  clientOptions.url = process.env.REDIS_URL;
} else if (redisHost) {
  clientOptions.socket = {
    host: redisHost,
    port: redisPort,
    ...(redisTls ? { tls: true as const } : {}),
  };
  if (redisUsername) clientOptions.username = redisUsername;
  if (redisPassword) clientOptions.password = redisPassword;
}

const client = await createClient(clientOptions)
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export type MessageType = {
    id: string,
    message: {
        url: string,
        id: string,
        regions?: string,
        interval?: string,
    }
}

export type AutoClaimResult = {
    nextId: string;
    messages: MessageType[];
};

export type WebsiteEvent = {
    url: string;
    id: string;
    regions?: string;
    interval?: number | string;
};

async function xAdd({ url, id, regions, interval }: WebsiteEvent) {
    const fields: Record<string, string> = {
        url,
        id,
    };
    if (regions) fields.regions = regions;
    if (interval !== undefined) fields.interval = String(interval);

    await client.xAdd(
        PROBE_STREAM, '*', fields
    );
}

async function ensureConsumerGroup(region: string) {
    try {
        await client.xGroupCreate(PROBE_STREAM, getRegionConsumerGroup(region), '0', { MKSTREAM: true });
    } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('BUSYGROUP')) {
            throw error;
        }
    }
}

export async function xAddBulk(websites: WebsiteEvent[]) {
    for (const website of websites) {
        await xAdd(website);
    }
}

export async function xReadGroup(regionId: string, workerId: string): Promise<MessageType[] | undefined> {
    const consumerGroup = getRegionConsumerGroup(regionId);
    await ensureConsumerGroup(regionId);

    const res = await client.xReadGroup(
        consumerGroup,
        workerId,
        {
            key: PROBE_STREAM,
            id: '>'
        },
        {
            COUNT: 5,
            BLOCK: 5000,
        }
    );

    let messages: MessageType[] | undefined = (res?.[0]?.messages as MessageType[] | undefined);
    return messages;
}

export async function xAutoClaim(
    region: string,
    workerId: string,
    minIdleTime = 60_000,
    startId = '0-0',
): Promise<AutoClaimResult> {
    await ensureConsumerGroup(region);
    const result = await client.xAutoClaim(
        PROBE_STREAM,
        getRegionConsumerGroup(region),
        workerId,
        minIdleTime,
        startId,
        { COUNT: 5 },
    );

    return {
        nextId: result.nextId,
        messages: result.messages.filter((message): message is MessageType => message !== null),
    };
}

async function xAck(regionId: string, eventId: string) {
    await client.xAck(PROBE_STREAM, getRegionConsumerGroup(regionId), eventId);
}

export async function xAckBulk(consumerGroup: string, eventIds: string[]) {
    if (!eventIds || eventIds.length === 0) return;
    await Promise.all(eventIds.map(eventId => xAck(consumerGroup, eventId)));
}

/**
 * Safely trims the probe stream so entries older than `retentionMs` are permanently evicted.
 * Uses approximate MINID trimming (`~`) to minimize Valkey CPU and memory-reclaim overhead.
 *
 * @param retentionMs Maximum age in milliseconds for stored probes. Defaults to DEFAULT_PROBE_RETENTION_MS (15 min).
 * @returns Number of entries deleted.
 */
export async function xTrimProbes(retentionMs: number = DEFAULT_PROBE_RETENTION_MS): Promise<number> {
    const cutoffTime = Date.now() - retentionMs;
    const minId = getProbeMinId(cutoffTime > 0 ? cutoffTime : 0);
    return await client.xTrim(PROBE_STREAM, 'MINID', minId, { strategyModifier: '~' });
}

/**
 * Trims probe stream to a specific minimum ID.
 */
export async function xTrimMinId(minId: string, exact = false): Promise<number> {
    return await client.xTrim(PROBE_STREAM, 'MINID', minId, {
        ...(exact ? { strategyModifier: '=' } : { strategyModifier: '~' }),
    });
}

/**
 * Permanently deletes specific stream entry IDs from the global probe stream.
 */
export async function xDel(eventIds: string | string[]): Promise<number> {
    return await client.xDel(PROBE_STREAM, eventIds);
}