import { haversineKm } from './dbscanCluster';
import { RANCHI_MUNICIPAL_ASSETS, MunicipalAsset } from '../data/assetsData';
import { RANCHI_INFRASTRUCTURE, InfrastructureFacility } from '../data/infrastructureData';

// ─── Configuration ───────────────────────────────────────────────────────────
// "Infrastructure Context Radius" — the search boundary for contextual evidence.
// 25 km is the boundary within which we gather evidence.
// The actual accessibility signal is the nearest-facility distance.
export const DEVELOPMENT_CONTEXT_RADIUS_KM = 25;

// ─── Infrastructure Type Mapping ──────────────────────────────────────────────
// Maps AI-produced subCategory strings to dataset infrastructure type keys.
// Never use raw LLM subCategory as a database lookup key.
export const SUBCATEGORY_TO_INFRA_TYPE: Record<string, string> = {
  'Hospital':                    'Hospital',
  'Hospital Access':             'Hospital',
  'Hospital Capacity':           'Hospital',
  'PHC':                         'PHC',
  'PHC Access':                  'PHC',
  'Healthcare Access':           'Hospital',
  'School':                      'School',
  'School Capacity':             'School',
  'Education Access':            'School',
  'Bus Stop':                    'Bus Stop',
  'Bus Connectivity':            'Bus Stop',
  'Public Transport':            'Bus Stop',
  'Water Supply':                'Water Point',
  'Water Access':                'Water Point',
  'Water Point':                 'Water Point',
};

// Fallback: derive infra type from category when subCategory is unmapped
export const CATEGORY_TO_INFRA_TYPE: Record<string, string> = {
  'Healthcare':        'Hospital',
  'Education':         'School',
  'Public Transport':  'Bus Stop',
  'Water':             'Water Point',
  'Roads':             'Bus Stop',
  'Electricity':       'Facility',
};

// ─── Gap Score Formulas (exact from specification) ───────────────────────────
export function infrastructureGapScore(count: number): number {
  if (count === 0) return 100;
  if (count === 1) return 80;
  if (count === 2) return 60;
  if (count === 3) return 40;
  if (count === 4) return 20;
  return 0; // 5 or more
}

export function accessibilityGapScore(nearestKm: number | undefined): number {
  if (nearestKm === undefined || isNaN(nearestKm)) return 100; // no facility found
  return Math.min(Math.round((nearestKm / DEVELOPMENT_CONTEXT_RADIUS_KM) * 100), 100);
}

export interface InfrastructureSearchResult {
  facilityCountWithinRadius: number;
  nearestFacilityDistanceKm?: number;
  nearestFacilityName?: string;
  nearestFacilityId?: string;
  averageFacilityDistanceKm?: number;
  infrastructureGapScore: number;
  accessibilityGapScore: number;
  infrastructureContextAvailable: boolean;
  resolvedInfrastructureType: string;
}

/**
 * Resolves the query to a standardized infrastructureType key.
 */
export function resolveInfrastructureType(subCategory?: string, category?: string): string {
  if (subCategory && SUBCATEGORY_TO_INFRA_TYPE[subCategory]) {
    return SUBCATEGORY_TO_INFRA_TYPE[subCategory];
  }
  // Try case-insensitive lookup
  if (subCategory) {
    const matchedKey = Object.keys(SUBCATEGORY_TO_INFRA_TYPE).find(
      (k) => k.toLowerCase() === subCategory.trim().toLowerCase()
    );
    if (matchedKey) return SUBCATEGORY_TO_INFRA_TYPE[matchedKey];
  }

  if (category && CATEGORY_TO_INFRA_TYPE[category]) {
    return CATEGORY_TO_INFRA_TYPE[category];
  }
  if (category) {
    const matchedCat = Object.keys(CATEGORY_TO_INFRA_TYPE).find(
      (k) => k.toLowerCase() === category.trim().toLowerCase()
    );
    if (matchedCat) return CATEGORY_TO_INFRA_TYPE[matchedCat];
  }

  return subCategory || category || 'General';
}

/**
 * Converts a municipal asset into the common InfrastructureFacility shape.
 */
export function convertMunicipalAssetToFacility(asset: MunicipalAsset): InfrastructureFacility | null {
  let infrastructureType = '';
  let category = '';

  const nameLower = asset.name.toLowerCase();
  const specLower = (asset.specifications || '').toLowerCase();

  if (asset.category === 'facility') {
    if (nameLower.includes('primary health centre') || nameLower.includes('phc')) {
      infrastructureType = 'PHC';
      category = 'Healthcare';
    } else if (nameLower.includes('hospital')) {
      infrastructureType = 'Hospital';
      category = 'Healthcare';
    } else if (nameLower.includes('school')) {
      infrastructureType = 'School';
      category = 'Education';
    } else {
      infrastructureType = 'Facility';
      category = 'General Infrastructure';
    }
  } else if (asset.category === 'water') {
    infrastructureType = 'Water Point';
    category = 'Water';
  } else if (asset.category === 'road') {
    infrastructureType = 'Road Segment';
    category = 'Roads';
  } else {
    return null;
  }

  return {
    id: asset.id,
    name: asset.name,
    infrastructureType,
    category,
    lat: asset.lat,
    lng: asset.lng,
    ward: asset.ward,
    capacityNote: asset.specifications
  };
}

/**
 * Creates a normalized composite key for deduplication.
 * key = `${normalized_name}|${lat.toFixed(3)}|${lng.toFixed(3)}`
 * where normalized_name = name.toLowerCase().replace(/\s+/g, '_').slice(0, 40)
 */
export function createFacilityKey(name: string, lat: number, lng: number): string {
  const normalized_name = (name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40);
  return `${normalized_name}|${Number(lat).toFixed(3)}|${Number(lng).toFixed(3)}`;
}

/**
 * Combines municipal assets and demo infrastructure datasets, deduplicating them.
 * If two records share the same composite key, the one from infrastructureData wins.
 */
export function getDeduplicatedFacilities(
  municipalAssets: MunicipalAsset[] = RANCHI_MUNICIPAL_ASSETS,
  infrastructureData: InfrastructureFacility[] = RANCHI_INFRASTRUCTURE
): InfrastructureFacility[] {
  const facilityMap = new Map<string, InfrastructureFacility>();

  // 1. Add municipal assets first
  for (const asset of municipalAssets) {
    const converted = convertMunicipalAssetToFacility(asset);
    if (converted) {
      const key = createFacilityKey(converted.name, converted.lat, converted.lng);
      facilityMap.set(key, converted);
    }
  }

  // 2. Add/overwrite with infrastructureData (richer data wins)
  for (const facility of infrastructureData) {
    const key = createFacilityKey(facility.name, facility.lat, facility.lng);
    facilityMap.set(key, facility);
  }

  return Array.from(facilityMap.values());
}

/**
 * Pure deterministic search for facilities within radiusKm.
 * Computes exact gap scores and distance metrics.
 */
export function searchInfrastructureWithin(
  lat: number,
  lng: number,
  subCategory: string,
  category: string,
  radiusKm = DEVELOPMENT_CONTEXT_RADIUS_KM,
  overrideFacilities?: InfrastructureFacility[]
): InfrastructureSearchResult {
  try {
    const resolvedType = resolveInfrastructureType(subCategory, category);
    const allFacilities = overrideFacilities || getDeduplicatedFacilities();

    if (!allFacilities || allFacilities.length === 0) {
      return {
        facilityCountWithinRadius: 0,
        infrastructureGapScore: 100,
        accessibilityGapScore: 100,
        infrastructureContextAvailable: false,
        resolvedInfrastructureType: resolvedType
      };
    }

    // Filter to facilities whose infrastructureType matches the resolved infra type
    const targetTypeLower = resolvedType.toLowerCase();
    const matchingFacilities = allFacilities.filter((f) => {
      const fType = (f.infrastructureType || '').toLowerCase();
      // Match direct type or category alignment
      if (fType === targetTypeLower) return true;
      // Also match Hospital/PHC under Healthcare if looking for Hospital
      if (targetTypeLower === 'hospital' && fType === 'phc') return true;
      if (targetTypeLower === 'phc' && fType === 'hospital') return true;
      return false;
    });

    // Calculate distance and filter by radiusKm
    const facilitiesWithDistance: { facility: InfrastructureFacility; distance: number }[] = [];

    for (const f of matchingFacilities) {
      const dist = haversineKm(lat, lng, f.lat, f.lng);
      if (dist <= radiusKm) {
        facilitiesWithDistance.push({ facility: f, distance: dist });
      }
    }

    // Sort ascending by distance
    facilitiesWithDistance.sort((a, b) => a.distance - b.distance);

    const count = facilitiesWithDistance.length;
    const gapScore = infrastructureGapScore(count);

    if (count === 0) {
      return {
        facilityCountWithinRadius: 0,
        infrastructureGapScore: gapScore, // 100
        accessibilityGapScore: 100,
        infrastructureContextAvailable: true,
        resolvedInfrastructureType: resolvedType
      };
    }

    const nearest = facilitiesWithDistance[0];
    const nearestKm = Number(nearest.distance.toFixed(1));
    const accessScore = accessibilityGapScore(nearestKm);

    const totalDist = facilitiesWithDistance.reduce((acc, curr) => acc + curr.distance, 0);
    const avgDistKm = Number((totalDist / count).toFixed(1));

    return {
      facilityCountWithinRadius: count,
      nearestFacilityDistanceKm: nearestKm,
      nearestFacilityName: nearest.facility.name,
      nearestFacilityId: nearest.facility.id,
      averageFacilityDistanceKm: avgDistKm,
      infrastructureGapScore: gapScore,
      accessibilityGapScore: accessScore,
      infrastructureContextAvailable: true,
      resolvedInfrastructureType: resolvedType
    };
  } catch (err) {
    console.error('[geospatialService] Error searching infrastructure:', err);
    return {
      facilityCountWithinRadius: 0,
      infrastructureGapScore: 100,
      accessibilityGapScore: 100,
      infrastructureContextAvailable: false,
      resolvedInfrastructureType: resolveInfrastructureType(subCategory, category)
    };
  }
}
