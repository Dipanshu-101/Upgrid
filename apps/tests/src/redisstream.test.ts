import { describe, expect, it } from 'vitest';
import { getRegionConsumerGroup, PROBE_STREAM } from 'redisstream/contract';

describe('probe stream contract', () => {
  it('uses one global stream', () => {
    expect(PROBE_STREAM).toBe('upgrid:probes');
  });

  it('normalizes region consumer groups', () => {
    expect(getRegionConsumerGroup(' India ')).toBe('india-group');
    expect(getRegionConsumerGroup('US')).toBe('us-group');
  });

  it('rejects an empty region', () => {
    expect(() => getRegionConsumerGroup('  ')).toThrow('Region must not be empty');
  });
});