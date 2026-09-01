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

async function main() {
    while(1) {
        const response = await xReadGroup(REGION_ID, WORKER_ID);

        if (!response) {
            continue;
        }

        let promises = response.map(({message}) => fetchWebsite(message.url, message.id))
        await Promise.all(promises);
        console.log(promises.length);

        xAckBulk(REGION_ID, response.map(({id}) => id));
    }
}

async function fetchWebsite(url: string, websiteId: string) {
    return new Promise<void>((resolve, reject) => {
        const startTime = Date.now();

        axios.get(url)
            .then(async () => { 
                const endTime = Date.now();
                await prismaClient.website_tick.create({
                    data: {
                       response_time_ms: endTime - startTime,
                        status: "Up",
                        region_id: REGION_ID,
                        website_id: websiteId
                    }
                })
                resolve()
            })
            .catch(async () => {
                const endTime = Date.now();
                await prismaClient.website_tick.create({
                    data: {
                        response_time_ms: endTime - startTime,
                        status: "Down",
                        region_id: REGION_ID,
                        website_id: websiteId
                    }
                })
                resolve()
            })
    })
}

// }
main()