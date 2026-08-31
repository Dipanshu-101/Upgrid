import {xAck ,xReadGroup } from 'redisstream/client';

const REGION_ID = process.env.REGION_ID;
const WORKER_ID = process.env.WORKER_ID;

if (!REGION_ID || !WORKER_ID) {
  throw new Error('REGION_ID and WORKER_ID environment variables must be set');
}
async function main() {
//  while(1) {
    //@ts-ignore
    const response = xReadGroup(REGION_ID, WORKER_ID);
    response.map= await (({id,message}) => {
        
    });
    //@ts-ignore
    xAck(REGION_ID,"a");
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

// }
main()