import {prismaClient} from "store/client";


function main() {
 let websites =prismaClient.website.findMany({
select : {
    url: true,
    id: true
}
})   
   redis.xPush
}
setInterval(()=>{
    main()
}, 3*1000);