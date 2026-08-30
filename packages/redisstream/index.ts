import { createClient } from "redis";

const client = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

type WebsiteEvent = {url:string,id:string}
const STREAM_NAME = 'upgrid:website';
async function xAdd({url,id}:WebsiteEvent){
    await client.xAdd (
        STREAM_NAME, '*', {
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

export async function xReadGroup(consumerGroup: string,workerId: string): Promise<any> {
    const res = await client.xReadGroup(
        consumerGroup,
        workerId,
        { key: STREAM_NAME,
          id: '>'
        },{
                COUNT: 5,
          }
    );
    console.log(res);
    return res;
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