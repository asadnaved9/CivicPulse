export interface DistrictDemographics {
  name: string;
  population: number;
  densityKm2: number;
  literacyRatePct: number;
  povertyHouseholdPct: number;
  bplHouseholds: number;
  infrastructureCount: {
    schools: number;
    healthClinics: number;
    waterConnectionsPct: number;
    pavedRoadsPct: number;
  };
  dataSource: string;
  censusYear: number;
}

export const INDIA_CENSUS_DATA: Record<string, DistrictDemographics> = {
  koramangala: {
    name: 'Koramangala (Ward 151)',
    population: 48500,
    densityKm2: 12400,
    literacyRatePct: 88.4,
    povertyHouseholdPct: 14.2,
    bplHouseholds: 1620,
    infrastructureCount: {
      schools: 12,
      healthClinics: 4,
      waterConnectionsPct: 78,
      pavedRoadsPct: 85
    },
    dataSource: 'Census of India 2011 & BBCC Socio-Economic Castes Survey (SECC)',
    censusYear: 2011
  },
  hsr_layout: {
    name: 'HSR Layout (Ward 174)',
    population: 62100,
    densityKm2: 15300,
    literacyRatePct: 86.1,
    povertyHouseholdPct: 18.7,
    bplHouseholds: 2740,
    infrastructureCount: {
      schools: 14,
      healthClinics: 3,
      waterConnectionsPct: 69,
      pavedRoadsPct: 79
    },
    dataSource: 'Census of India 2011 & BBCC Socio-Economic Castes Survey (SECC)',
    censusYear: 2011
  },
  indiranagar: {
    name: 'Indiranagar (Ward 80)',
    population: 52400,
    densityKm2: 13800,
    literacyRatePct: 91.2,
    povertyHouseholdPct: 11.5,
    bplHouseholds: 1380,
    infrastructureCount: {
      schools: 16,
      healthClinics: 6,
      waterConnectionsPct: 84,
      pavedRoadsPct: 92
    },
    dataSource: 'Census of India 2011 & BBCC Socio-Economic Castes Survey (SECC)',
    censusYear: 2011
  },
  whitefield: {
    name: 'Whitefield (Ward 84)',
    population: 89000,
    densityKm2: 9800,
    literacyRatePct: 84.8,
    povertyHouseholdPct: 22.4,
    bplHouseholds: 4410,
    infrastructureCount: {
      schools: 11,
      healthClinics: 2,
      waterConnectionsPct: 54,
      pavedRoadsPct: 68
    },
    dataSource: 'Census of India 2011 & BBCC Socio-Economic Castes Survey (SECC)',
    censusYear: 2011
  }
};

export function lookupDemographics(wardOrDistrict?: string): DistrictDemographics | null {
  if (!wardOrDistrict) return null;
  const key = wardOrDistrict.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [canonical, data] of Object.entries(INDIA_CENSUS_DATA)) {
    const compactKey = canonical.replace(/[^a-z0-9]/g, '');
    if (key.includes(compactKey) || compactKey.includes(key)) {
      return data;
    }
  }

  if (key.includes('kora')) return INDIA_CENSUS_DATA['koramangala'];
  if (key.includes('hsr')) return INDIA_CENSUS_DATA['hsr_layout'];
  if (key.includes('indira')) return INDIA_CENSUS_DATA['indiranagar'];
  if (key.includes('white')) return INDIA_CENSUS_DATA['whitefield'];

  return null;
}
