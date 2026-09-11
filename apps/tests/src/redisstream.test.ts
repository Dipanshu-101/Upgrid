import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROBE_RETENTION_MS,
  getProbeMinId,
  getRegionConsumerGroup,
  PROBE_STREAM,
} from 'redisstream/contract';

describe('probe stream contract', () => {
  it('uses one global stream', () => {
    expect(PROBE_STREAM).toBe('upgrid:probes');
  });

  it('defines default retention window of 15 minutes', () => {
    expect(DEFAULT_PROBE_RETENTION_MS).toBe(15 * 60 * 1000);
  });

  it('formats probe minId properly for stream trimming', () => {
    expect(getProbeMinId(1700000000000)).toBe('1700000000000-0');
    expect(getProbeMinId(0)).toBe('0-0');
  });

  it('rejects a negative cutoff timestamp', () => {
    expect(() => getProbeMinId(-1)).toThrow('Cutoff timestamp must be non-negative');
  });

  it('normalizes region consumer groups', () => {
    expect(getRegionConsumerGroup(' India ')).toBe('india-group');
    expect(getRegionConsumerGroup('US')).toBe('us-group');
  });

  it('rejects an empty region', () => {
    expect(() => getRegionConsumerGroup('  ')).toThrow('Region must not be empty');
  });
});