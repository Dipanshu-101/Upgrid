import { describe, expect, it } from 'vitest';
import { xAddBulk, xReadGroup } from 'redisstream/client';

const runRedisIntegration = process.env.RUN_REDIS_INTEGRATION === '1';

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
});