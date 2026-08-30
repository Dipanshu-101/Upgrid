import { createClient } from "redis";

const client = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

type WebsiteEvent = {url:string,id:string}

export async function xAdd({url,id}:WebsiteEvent){
    await client.xAdd (
        'upgrid:website', '*', {
            
        }
    );
    }



export  async function xAddBulk(websties:WebsiteEvent[]){