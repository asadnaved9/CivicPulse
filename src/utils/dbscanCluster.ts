// @ts-ignore - density-clustering has no bundled TypeScript declarations
import densityClustering from 'density-clustering';

export interface SpatialPoint {
  id: string;
  lat: number;
  lng: number;
  category?: string;
  ward?: string;
  title?: string;
  [key: string]: any;
}

export interface ClusterResult {
  clusterId: string;
  category: string;
  center: { lat: number; lng: number };
  memberIds: string[];
  members: SpatialPoint[];
  radiusKm: number;
  ward: string;
  theme: string;
  aiSummary: string;
}

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Groups points by category and executes DBSCAN within each category.
 * Also handles noise points gracefully by grouping remaining unclustered points into a fallback cluster if needed.
 * 
 * @param points Array of spatial points (civic suggestions/issues)
 * @param epsilonKm Maximum search radius in kilometers (default: 2.5 km)
 * @param minPoints Minimum points required to form a dense core cluster (default: 2)
 */
export function clusterWithDBSCAN(
  points: SpatialPoint[],
  epsilonKm: number = 2.5,
  minPoints: number = 2
): ClusterResult[] {
  const validPoints = points.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number');
  if (validPoints.length === 0) return [];

  // Group by category
  const categoryBuckets: Record<string, SpatialPoint[]> = {};
  for (const point of validPoints) {
    const cat = (point.category || 'General').trim();
    if (!categoryBuckets[cat]) categoryBuckets[cat] = [];
    categoryBuckets[cat].push(point);
  }

  const results: ClusterResult[] = [];
  let clusterIndex = 1;

  // 1 degree of latitude is roughly 111km
  // epsilon in degrees roughly = epsilonKm / 111
  const epsilonDeg = epsilonKm / 111.0;

  const DBSCAN = (densityClustering as any).DBSCAN || (densityClustering as any).default?.DBSCAN || densityClustering;
  const dbscan = new DBSCAN();

  for (const [cat, catPoints] of Object.entries(categoryBuckets)) {
    if (catPoints.length === 0) continue;

    // Format dataset as 2D coordinates [lat, lng]
    const dataset = catPoints.map(p => [p.lat, p.lng]);

    let clustersIdxs: number[][] = [];
    let noiseIdxs: number[] = [];

    try {
      // Run DBSCAN clustering
      clustersIdxs = dbscan.run(dataset, epsilonDeg, minPoints);
      noiseIdxs = dbscan.noise || [];
    } catch (e) {
      console.warn(`[DBSCAN] Clustering error for category "${cat}", using single bucket fallback:`, e);
      clustersIdxs = [catPoints.map((_, i) => i)];
      noiseIdxs = [];
    }

    // Process formed dense clusters
    for (const memberIndexes of clustersIdxs) {
      if (memberIndexes.length === 0) continue;
      const members = memberIndexes.map(idx => catPoints[idx]);
      const clusterObj = createClusterFromMembers(members, cat, `dbscan_${clusterIndex++}`);
      results.push(clusterObj);
    }

    // Handle noise points (isolated points in this category)
    // If we have noise points, group them by nearest ward or keep singletons so no citizen request is dropped
    for (const noiseIdx of noiseIdxs) {
      const singleton = catPoints[noiseIdx];
      const clusterObj = createClusterFromMembers([singleton], cat, `dbscan_iso_${clusterIndex++}`);
      results.push(clusterObj);
    }
  }

  return results;
}

function createClusterFromMembers(members: SpatialPoint[], category: string, id: string): ClusterResult {
  const avgLat = members.reduce((sum, m) => sum + m.lat, 0) / members.length;
  const avgLng = members.reduce((sum, m) => sum + m.lng, 0) / members.length;

  let maxDist = 0;
  for (const m of members) {
    const d = haversineKm(avgLat, avgLng, m.lat, m.lng);
    if (d > maxDist) maxDist = d;
  }

  const ward = members[0].ward || members[0].enrichedMetadata?.ward || 'Local Ward';
  const theme = `${ward} ${category} Consolidated Improvement`;
  const aiSummary = `DBSCAN clustered ${members.length} citizen submissions in ${ward} regarding ${category}. Key concerns include: ${members.map(m => m.title || 'Untitled').slice(0, 3).join('; ')}${members.length > 3 ? '...' : ''}.`;

  return {
    clusterId: id,
    category,
    center: {
      lat: parseFloat(avgLat.toFixed(4)),
      lng: parseFloat(avgLng.toFixed(4))
    },
    memberIds: members.map(m => m.id),
    members,
    radiusKm: parseFloat(maxDist.toFixed(2)),
    ward,
    theme,
    aiSummary
  };
}
