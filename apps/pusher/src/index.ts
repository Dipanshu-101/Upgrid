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
  await xAddBulk(websites);
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
