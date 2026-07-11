import geohash from 'ngeohash';

/**
 * Encodes a latitude and longitude into a geohash string.
 * Now powered by the ngeohash library as per the GPS Auto-Detection plan.
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 7): string {
  return geohash.encode(lat, lng, precision);
}
