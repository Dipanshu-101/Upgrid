import { createClient } from "redis";
import { getRegionConsumerGroup, PROBE_STREAM } from './contract.js';

export { getRegionConsumerGroup, PROBE_STREAM } from './contract.js';

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

type MessageType = {
    id: string,
    message: {
        url: string,
        id: string
    }
    //@ts-ignore
}

export type AutoClaimResult = {
    nextId: string;
    messages: MessageType[];
};
const STREAM_PREFIX = 'upgrid:website';
const CONSUMER_GROUP = 'workers';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getStreamName(regionId: string): string {
    if (!UUID_PATTERN.test(regionId)) {
        throw new Error(`Invalid region UUID: ${regionId}`);
    }
    return `${STREAM_PREFIX}:${regionId}`;
}

type WebsiteEvent = {url:string,id:string}
async function xAdd({url,id}:WebsiteEvent){
    await client.xAdd (
        PROBE_STREAM, '*', {
            url,
            id
        }
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


export async function xAddBulk(websties: WebsiteEvent[]) {
    for (const website of websties) {
        await xAdd({
            url: website.url,
            id: website.id,
        });
    }
}

export async function xReadGroup(regionId: string,workerId: string): Promise<MessageType[] | undefined> {
    const consumerGroup = getRegionConsumerGroup(regionId);
    await ensureConsumerGroup(regionId);

    const res = await client.xReadGroup(
                consumerGroup,
        workerId,
                { key: PROBE_STREAM,
          id: '>'
        },{
                COUNT: 5,
                                BLOCK: 5000,
          }
    );
 //@ts-ignore
    let messages: MessageType[] | undefined = res?.[0]?.messages;

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
    await client.xAck(PROBE_STREAM, getRegionConsumerGroup(regionId), eventId)
}

export async function xAckBulk(consumerGroup: string, eventIds: string[]) {
    await Promise.all(eventIds.map(eventId => xAck(consumerGroup, eventId)));
}













// Other application code
//         │
//         ↓
//    xAddBulk()
//         │
//         ├── xAdd()
//         ├── xAdd()
//         ├── xAdd()
//         └── xAdd()
//                 │
//                 ↓
//          Redis Stream
//        upgrid:website