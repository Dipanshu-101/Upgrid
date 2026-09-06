import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createClient } from 'redis';
import { xAckBulk, xAddBulk, xAutoClaim, xReadGroup } from 'redisstream/client';

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

  it('distributes probes among workers in one region group', async () => {
    const suffix = Date.now();
    const probes = Array.from({length: 8}, (_, index) => ({
      id: `probe-${suffix}-${index}`,
      url: `https://${index}.example.com`,
    }));

    await xAddBulk(probes);
    const [workerOneMessages, workerTwoMessages] = await Promise.all([
      xReadGroup(`india-${suffix}`, `india-worker-1-${suffix}`),
      xReadGroup(`india-${suffix}`, `india-worker-2-${suffix}`),
    ]);
    const workerOneIds = workerOneMessages?.map(({message}) => message.id) ?? [];
    const workerTwoIds = workerTwoMessages?.map(({message}) => message.id) ?? [];

    expect(workerOneIds.length).toBeGreaterThan(0);
    expect(workerTwoIds.length).toBeGreaterThan(0);
    expect(new Set([...workerOneIds, ...workerTwoIds])).toEqual(new Set(probes.map(({id}) => id)));
    expect(workerOneIds.filter((id) => workerTwoIds.includes(id))).toEqual([]);
  });

  it('keeps acknowledgements isolated between region groups', async () => {
    const suffix = Date.now();
    const probe = { id: `probe-${suffix}`, url: 'https://one.example.com' };

    await xAddBulk([probe]);
    const indiaMessages = await xReadGroup(`india-${suffix}`, `india-worker-${suffix}`);
    const usMessages = await xReadGroup(`us-${suffix}`, `us-worker-${suffix}`);

    await xAckBulk(`india-${suffix}`, indiaMessages?.map(({id}) => id) ?? []);
    const recoveredIndia = await xAutoClaim(`india-${suffix}`, `india-recovery-${suffix}`, 0);
    const recoveredUs = await xAutoClaim(`us-${suffix}`, `us-recovery-${suffix}`, 0);

    expect(recoveredIndia.messages.map(({message}) => message.id)).not.toContain(probe.id);
    expect(recoveredUs.messages.map(({message}) => message.id)).toContain(probe.id);
    expect(usMessages?.map(({message}) => message.id)).toContain(probe.id);
  });

  it('recovers a probe from a failed worker', async () => {
    const suffix = Date.now();
    const probe = { id: `probe-${suffix}`, url: 'https://one.example.com' };

    await xAddBulk([probe]);
    await xReadGroup(`india-${suffix}`, `failed-worker-${suffix}`);

    const recovered = await xAutoClaim(
      `india-${suffix}`,
      `replacement-worker-${suffix}`,
      0,
    );

    expect(recovered.messages.map(({message}) => message.id)).toContain(probe.id);
  });
});