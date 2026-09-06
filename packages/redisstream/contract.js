export const PROBE_STREAM = 'upgrid:probes';
export function getRegionConsumerGroup(region) {
    if (!region.trim()) {
        throw new Error('Region must not be empty');
    }
    return `${region.trim().toLowerCase()}-group`;
}
