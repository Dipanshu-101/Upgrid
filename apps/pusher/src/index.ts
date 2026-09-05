import { prismaClient } from 'store/client';
import { xAddBulk } from 'redisstream/client';

async function main() {
  const websites = await prismaClient.website.findMany({
    select: {
      url: true,
      id: true,
    },
  });
  const regions = await prismaClient.region.findMany({
    select: {
      id: true,
    },
  });
  console.log('Websites fetched:', websites.length);
  console.log('Regions found:', regions.length);
  for (const region of regions) {
    await xAddBulk(
      websites.map((website) => ({
        url: website.url,
        id: website.id,
        regionId: region.id,
      })),
    );
  }
}

void main().catch((error) => {
  console.error('Pusher stopped:', error);
  process.exitCode = 1;
});

setInterval(() => {
  void main().catch((error) => {
    console.error('Pusher run failed:', error);
  });
}, 3 * 1000);
