import 'dotenv/config';
import {xAckBulk ,xReadGroup } from 'redisstream/client';
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
const WORKER_ID = getRequiredEnv('WORKER_ID');

console.log(`Worker ${WORKER_ID} listening on region ${REGION_ID}`);

async function main() {
    while(1) {
        const response = await xReadGroup(REGION_ID, WORKER_ID);

        if (!response) {
            continue;
        }

        const promises = response.map(({message}) => fetchWebsite(message.url, message.id));
        await Promise.all(promises);
        console.log(promises.length);

        await xAckBulk(REGION_ID, response.map(({id}) => id));
    }
}

async function fetchWebsite(url: string, websiteId: string) {
    const startTime = Date.now();
    let status: "Up" | "Down" = "Up";

    try {
        await axios.get(url);
    } catch {
        status = "Down";
    }

    await prismaClient.website_tick.create({
        data: {
            response_time_ms: Date.now() - startTime,
            status,
            region_id: REGION_ID,
            website_id: websiteId,
        },
    });
}

// }
main().catch((error) => {
    console.error('Worker stopped:', error);
    process.exitCode = 1;
});