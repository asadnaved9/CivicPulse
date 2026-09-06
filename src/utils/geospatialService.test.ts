import assert from 'node:assert';
import { haversineKm } from './dbscanCluster';
import {
  searchInfrastructureWithin,
  infrastructureGapScore,
  accessibilityGapScore,
  getDeduplicatedFacilities,
  createFacilityKey,
  DEVELOPMENT_CONTEXT_RADIUS_KM
} from './geospatialService';
import { InfrastructureFacility } from '../data/infrastructureData';
import { MunicipalAsset } from '../data/assetsData';

console.log('--- Running GeospatialService Deterministic Unit Tests ---');

// ── Test 1: Known Ranchi location + Healthcare category ──
{
  // Shaheed Chowk Ranchi coordinates: (23.3710, 85.3245)
  const ranchiLat = 23.3710;
  const ranchiLng = 85.3245;
  const res = searchInfrastructureWithin(ranchiLat, ranchiLng, 'Hospital Access', 'Healthcare');

  assert.strictEqual(res.infrastructureContextAvailable, true, 'Context should be available for Ranchi');
  assert.ok(res.facilityCountWithinRadius >= 1, `Expected facilityCount >= 1, got ${res.facilityCountWithinRadius}`);
  assert.ok(
    res.nearestFacilityDistanceKm !== undefined && res.nearestFacilityDistanceKm >= 0,
    `Expected valid nearestFacilityDistanceKm, got ${res.nearestFacilityDistanceKm}`
  );
  assert.ok(res.infrastructureGapScore <= 80, `Expected gap score to reflect existing facilities, got ${res.infrastructureGapScore}`);
  console.log('✔ Test 1 Passed: Known Ranchi location has Healthcare facilities within 25km.');
}

// ── Test 2: Location outside Ranchi + rare category ──
{
  // Location far away in the Pacific Ocean: (0, 0)
  const res = searchInfrastructureWithin(0, 0, 'NonExistentSubCat', 'RareCategory');

  assert.strictEqual(res.facilityCountWithinRadius, 0, 'Expected 0 facilities at (0,0)');
  assert.strictEqual(res.infrastructureGapScore, 100, 'Expected infrastructureGapScore 100 for 0 facilities');
  assert.strictEqual(res.accessibilityGapScore, 100, 'Expected accessibilityGapScore 100 for no facility');
  assert.strictEqual(res.infrastructureContextAvailable, true, 'Zero facilities is a valid measurement, context available');
  console.log('✔ Test 2 Passed: Remote location with 0 facilities yields max gap scores (100).');
}

// ── Test 3: Identical coordinates ──
{
  const lat = 23.3710;
  const lng = 85.3245;
  const dist = haversineKm(lat, lng, lat, lng);
  assert.strictEqual(dist, 0, `Expected haversine distance for identical coordinates to be 0, got ${dist}`);
  console.log('✔ Test 3 Passed: Identical coordinates return 0 distance.');
}

// ── Test 4: Boundary precision ──
{
  // We can calculate coordinates that are exactly 25.0 km and 25.001 km away north
  // 1 degree latitude is approx 111.195 km
  const originLat = 23.0;
  const originLng = 85.0;

  // Let's create two mock facilities: one at exactly 25.0 km, one at 25.001 km
  // Using haversine, find deltaLat
  // d = R * dLat_rad => dLat_rad = d / R
  const R = 6371;
  const dLat25Rad = 25.0 / R;
  const dLat25Deg = dLat25Rad * (180 / Math.PI);

  const dLat25001Rad = 25.001 / R;
  const dLat25001Deg = dLat25001Rad * (180 / Math.PI);

  const facilityAt25Km: InfrastructureFacility = {
    id: 'TEST-BOUND-1',
    name: 'Facility Exactly at 25km',
    infrastructureType: 'Hospital',
    category: 'Healthcare',
    lat: originLat + dLat25Deg,
    lng: originLng
  };

  const facilityAt25001Km: InfrastructureFacility = {
    id: 'TEST-BOUND-2',
    name: 'Facility at 25.001km',
    infrastructureType: 'Hospital',
    category: 'Healthcare',
    lat: originLat + dLat25001Deg,
    lng: originLng
  };

  const dist25 = haversineKm(originLat, originLng, facilityAt25Km.lat, facilityAt25Km.lng);
  const dist25001 = haversineKm(originLat, originLng, facilityAt25001Km.lat, facilityAt25001Km.lng);

  assert.ok(Math.abs(dist25 - 25.0) < 0.0001, `Expected dist25 to be 25.0 km, got ${dist25}`);
  assert.ok(dist25001 > 25.0, `Expected dist25001 to be > 25.0 km, got ${dist25001}`);

  const mockSet = [facilityAt25Km, facilityAt25001Km];
  const boundaryRes = searchInfrastructureWithin(
    originLat,
    originLng,
    'Hospital',
    'Healthcare',
    DEVELOPMENT_CONTEXT_RADIUS_KM,
    mockSet
  );

  assert.strictEqual(
    boundaryRes.facilityCountWithinRadius,
    1,
    `Expected exactly 1 facility within 25.0km boundary, got ${boundaryRes.facilityCountWithinRadius}`
  );
  assert.strictEqual(
    boundaryRes.nearestFacilityId,
    'TEST-BOUND-1',
    'Expected boundary facility to be included'
  );
  console.log('✔ Test 4 Passed: 25.0km facility included, 25.001km facility excluded.');
}

// ── Test 5: Duplicate deduplication ──
{
  const duplicateName = 'Shaheed Chowk Urban Primary Health Centre Facility';
  const sharedLat = 23.3710;
  const sharedLng = 85.3245;

  const mockMunicipalAsset: MunicipalAsset = {
    id: 'AST-FC-601',
    name: duplicateName,
    category: 'facility',
    condition: 'healthy',
    lat: sharedLat,
    lng: sharedLng,
    address: 'Shaheed Chowk, Ward 18, Ranchi',
    ward: 'Ward 18',
    department: 'Health Dept',
    installDate: '2019-10-05',
    lastInspectionDate: '2026-08-01',
    activeComplaintsCount: 0,
    healthScore: 88,
    specifications: '30-bed observation ward'
  };

  const mockInfraFacility: InfrastructureFacility = {
    id: 'INF-HC-003',
    name: duplicateName,
    infrastructureType: 'PHC',
    category: 'Healthcare',
    lat: sharedLat,
    lng: sharedLng,
    ward: 'Ward 18',
    capacityNote: 'Rich data from infrastructure registry'
  };

  // Run deduplication with both records containing identical composite key
  const deduplicated = getDeduplicatedFacilities([mockMunicipalAsset], [mockInfraFacility]);

  // Both should collapse into 1 record
  const matches = deduplicated.filter(
    (f) => f.lat.toFixed(3) === sharedLat.toFixed(3) && f.lng.toFixed(3) === sharedLng.toFixed(3)
  );

  assert.strictEqual(matches.length, 1, `Expected exactly 1 facility after deduplication, got ${matches.length}`);
  // Richer data from infrastructureData must win
  assert.strictEqual(matches[0].id, 'INF-HC-003', 'Expected infrastructureData record to win over municipal asset');
  assert.strictEqual(matches[0].capacityNote, 'Rich data from infrastructure registry');

  console.log('✔ Test 5 Passed: Duplicate facility collapsed to 1 and infrastructureData won on conflict.');
}

console.log('\nAll 5 GeospatialService tests passed successfully! ✅');
