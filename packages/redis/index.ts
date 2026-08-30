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



export  async function xAddBulk(websties:WebsiteEvent[]){
    for (let i = 0; i < websties.length; i++) {
        await xAdd({
           url:websties[i].url,
           id:websties[i].id
        })
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