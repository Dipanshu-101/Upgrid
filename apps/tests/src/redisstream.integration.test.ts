import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createClient } from 'redis';
import { xAddBulk, xReadGroup } from 'redisstream/client';

const runRedisIntegration = process.env.RUN_REDIS_INTEGRATION === '1';
const redisClient = runRedisIntegration
  ? await createClient().connect()
  : undefined;

beforeEach(async () => {
  if (redisClient) {
    await redisClient.flushDb();
  }
});

afterAll(async () => {
  await redisClient?.quit();
});

describe.skipIf(!runRedisIntegration)('global probe stream', () => {
  it('delivers every published probe to one region group', async () => {
    const region = `integration-one-${Date.now()}`;
    const probes = [
      { id: `probe-${Date.now()}-1`, url: 'https://one.example.com' },
      { id: `probe-${Date.now()}-2`, url: 'https://two.example.com' },
      { id: `probe-${Date.now()}-3`, url: 'https://three.example.com' },
    ];

    await xAddBulk(probes);
    const messages = await xReadGroup(region, `worker-${region}`);

    expect(messages?.map(({message}) => message.id)).toEqual(probes.map(({id}) => id));
  });

  it('delivers every published probe to multiple region groups', async () => {
    const suffix = Date.now();
    const probes = [
      { id: `probe-${suffix}-1`, url: 'https://one.example.com' },
      { id: `probe-${suffix}-2`, url: 'https://two.example.com' },
    ];

    await xAddBulk(probes);
    const indiaMessages = await xReadGroup(`india-${suffix}`, `india-worker-${suffix}`);
    const usMessages = await xReadGroup(`us-${suffix}`, `us-worker-${suffix}`);

    expect(indiaMessages?.map(({message}) => message.id)).toEqual(probes.map(({id}) => id));
    expect(usMessages?.map(({message}) => message.id)).toEqual(probes.map(({id}) => id));
  });
});