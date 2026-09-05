import { createClient } from "redis";

const client = await createClient()
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
const STREAM_PREFIX = 'upgrid:website';
const CONSUMER_GROUP = 'workers';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getStreamName(regionId: string): string {
    if (!UUID_PATTERN.test(regionId)) {
        throw new Error(`Invalid region UUID: ${regionId}`);
    }
    return `${STREAM_PREFIX}:${regionId}`;
}

type WebsiteEvent = {url:string,id:string,regionId:string}
async function xAdd({url,id,regionId}:WebsiteEvent){
    const streamName = getStreamName(regionId);
    await client.xAdd (
        streamName, '*', {
            url,
            id
        }
    );
    }



export async function xAddBulk(websties: WebsiteEvent[]) {
    for (const website of websties) {
        await xAdd({
            url: website.url,
            id: website.id,
            regionId: website.regionId,
        });
    }
}

export async function xReadGroup(regionId: string,workerId: string): Promise<MessageType[] | undefined> {
    const streamName = getStreamName(regionId);
    try {
        await client.xGroupCreate(streamName, CONSUMER_GROUP, '0', { MKSTREAM: true });
    } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('BUSYGROUP')) {
            throw error;
        }
    }

    const res = await client.xReadGroup(
        CONSUMER_GROUP,
        workerId,
        { key: streamName,
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

async function xAck(regionId: string, eventId: string) {
    await client.xAck(getStreamName(regionId), CONSUMER_GROUP, eventId)
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