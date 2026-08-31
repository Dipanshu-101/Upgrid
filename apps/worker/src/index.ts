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

// }
main()