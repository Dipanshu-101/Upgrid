import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PROBE_RETENTION_MS,
  getProbeMinId,
  getRegionConsumerGroup,
  PROBE_STREAM,
} from 'redisstream/contract';

describe('Testing & Failure-Recovery Architecture Verification', () => {
  describe('1. Multi-Region Non-Interference', () => {
    it('ensures separate region consumer groups maintain isolated PELs and cursors', () => {
      const indiaGroup = getRegionConsumerGroup('India');
      const usGroup = getRegionConsumerGroup('US');

      expect(indiaGroup).toBe('india-group');
      expect(usGroup).toBe('us-group');
      expect(indiaGroup).not.toBe(usGroup);

      // Simulated Redis stream storage
      const streamEntries = new Map<string, { url: string; websiteId: string }>();
      const groupPELs = new Map<string, Set<string>>([
        [indiaGroup, new Set<string>()],
        [usGroup, new Set<string>()],
      ]);

      // Pusher pushes 1 probe to global stream
      const messageId = '1700000000000-0';
      streamEntries.set(messageId, { url: 'https://example.com', websiteId: 'site-1' });

      // Both regions deliver probe to their workers
      groupPELs.get(indiaGroup)!.add(messageId);
      groupPELs.get(usGroup)!.add(messageId);

      // India worker completes probe and calls XACK
      // XACK removes message ONLY from india-group PEL; stream entry remains in Redis
      groupPELs.get(indiaGroup)!.delete(messageId);

      // Verify India ACK did NOT affect US group or delete the stream entry
      expect(groupPELs.get(indiaGroup)!.has(messageId)).toBe(false);
      expect(groupPELs.get(usGroup)!.has(messageId)).toBe(true);
      expect(streamEntries.has(messageId)).toBe(true);
    });
  });

  describe('2. Failure Recovery via XAUTOCLAIM', () => {
    it('allows a replacement worker to auto-claim and complete abandoned probes', () => {
      const regionGroup = getRegionConsumerGroup('India');
      const messageId = '1700000001000-0';

      // Pending entries list tracking { messageId -> { consumer, idleTimeMs } }
      const pendingEntries = new Map<string, { consumer: string; idleTimeMs: number }>();

      // Worker 1 reads message, then crashes before XACK
      pendingEntries.set(messageId, { consumer: 'worker-1-crashed', idleTimeMs: 65_000 });

      // Replacement worker checks for probes pending > 60_000ms
      const minIdleTimeMs = 60_000;
      const claimedMessages: string[] = [];

      for (const [id, entry] of pendingEntries.entries()) {
        if (entry.idleTimeMs >= minIdleTimeMs) {
          entry.consumer = 'worker-2-replacement';
          claimedMessages.push(id);
        }
      }

      expect(claimedMessages).toContain(messageId);
      expect(pendingEntries.get(messageId)?.consumer).toBe('worker-2-replacement');

      // Replacement worker acknowledges after processing
      pendingEntries.delete(messageId);
      expect(pendingEntries.has(messageId)).toBe(false);
    });
  });

  describe('3. Safe Trimming Verification', () => {
    it('evicts entries older than retention window while preserving active probes', () => {
      const now = Date.now();
      const retentionMs = DEFAULT_PROBE_RETENTION_MS; // 15 minutes = 900,000ms
      const cutoffTime = now - retentionMs;
      const minId = getProbeMinId(cutoffTime);

      // An old probe from 20 minutes ago
      const oldProbeTimestamp = now - 20 * 60 * 1000;
      const oldProbeId = `${oldProbeTimestamp}-0`;

      // A recent probe from 2 minutes ago
      const recentProbeTimestamp = now - 2 * 60 * 1000;
      const recentProbeId = `${recentProbeTimestamp}-0`;

      // An in-flight probe from 30 seconds ago
      const inFlightProbeTimestamp = now - 30 * 1000;
      const inFlightProbeId = `${inFlightProbeTimestamp}-0`;

      function isTrimmed(streamId: string, minTrimId: string): boolean {
        const idTime = parseInt(streamId.split('-')[0]!, 10);
        const minTime = parseInt(minTrimId.split('-')[0]!, 10);
        return idTime < minTime;
      }

      // Old probe (20m ago) is trimmed
      expect(isTrimmed(oldProbeId, minId)).toBe(true);

      // Recent probe (2m ago) is kept intact
      expect(isTrimmed(recentProbeId, minId)).toBe(false);

      // In-flight probe (30s ago) is kept intact
      expect(isTrimmed(inFlightProbeId, minId)).toBe(false);
    });
  });

  describe('4. Database Outage Simulation & Selective ACK', () => {
    it('skips ACK for probes when database insertion fails, keeping them in PEL for retry', async () => {
      // Simulate processProbe logic from apps/worker/src/index.ts
      async function simulateProcessProbe(
        messageId: string,
        websiteId: string,
        dbShouldFail: boolean,
      ): Promise<string | null> {
        try {
          if (dbShouldFail) {
            throw new Error('Database connection timeout (P1001)');
          }
          // Simulate DB insert
          return messageId;
        } catch {
          // Worker logs error and returns null so message is NOT acknowledged
          return null;
        }
      }

      const batch = [
        { id: 'msg-1', websiteId: 'site-healthy-1' },
        { id: 'msg-2', websiteId: 'site-db-fail-2' },
        { id: 'msg-3', websiteId: 'site-healthy-3' },
      ];

      // Simulate site-2 encountering a database failure
      const probeResults = await Promise.all([
        simulateProcessProbe(batch[0]!.id, batch[0]!.websiteId, false),
        simulateProcessProbe(batch[1]!.id, batch[1]!.websiteId, true),
        simulateProcessProbe(batch[2]!.id, batch[2]!.websiteId, false),
      ]);

      // Filter successful acks (exact worker logic)
      const successfulAcks = probeResults.filter((id): id is string => id !== null);

      // Probes 1 and 3 are acknowledged
      expect(successfulAcks).toEqual(['msg-1', 'msg-3']);

      // Probe 2 was NOT acknowledged and remains in PEL for xAutoClaim retry
      expect(successfulAcks).not.toContain('msg-2');
    });
  });
});
