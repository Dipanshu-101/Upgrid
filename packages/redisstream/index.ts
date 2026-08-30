import { createClient } from "redis";

const client = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

type WebsiteEvent = {url:string,id:string}

async function xAdd({url,id}:WebsiteEvent){
    await client.xAdd (
        'upgrid:website', '*', {
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
        });
    }
}

export async function xReadGroup(groupName: string, consumerName: string) {
    const result = await client.xReadGroup(
        groupName,
        consumerName,
        { key: 'upgrid:website', id: '>' },
        { COUNT: 10, BLOCK: 5000 }
    );

    if (result) {
        for (const stream of result) {
            for (const message of stream.messages) {
                console.log(`Received message from stream ${stream.name}:`, message);
                // Process the message here
            }
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