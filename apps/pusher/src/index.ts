import { prismaClient } from 'store/client';
import { xAddBulk } from 'redisstream/client';

async function main() {
  const websites = await prismaClient.website.findMany({
    select: {
      url: true,
      id: true,
    },
  });
console.log('Websites fetched:', websites.length);
  await xAddBulk(
    websites.map((website) => ({
      url: website.url,
      id: website.id,
    })),
  );
}

setInterval(() => {
  void main();
}, 3 * 1000 * 60);
