export const PROBE_STREAM = 'upgrid:probes';
export const DEFAULT_PROBE_RETENTION_MS = 15 * 60 * 1000;

export function getRegionConsumerGroup(region) {
    if (!region.trim()) {
        throw new Error('Region must not be empty');
    }
    return `${region.trim().toLowerCase()}-group`;
}

export function getProbeMinId(cutoffTimeMs) {
    if (cutoffTimeMs < 0) {
        throw new Error('Cutoff timestamp must be non-negative');
    }
    return `${cutoffTimeMs}-0`;
}
