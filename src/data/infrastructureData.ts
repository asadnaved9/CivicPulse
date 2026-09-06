/**
 * Demo Infrastructure Facilities Dataset for Ranchi Region
 * NOTE: This is a curated demo dataset for development-needs intake and context calculation.
 * It is used alongside municipal asset registries for deterministic geospatial intelligence.
 */

export interface InfrastructureFacility {
  id: string;
  name: string;
  infrastructureType: string;   // "Hospital" | "PHC" | "School" | "Bus Stop" | "Water Point"
  category: string;             // "Healthcare" | "Education" | "Public Transport" | "Water"
  lat: number;
  lng: number;
  ward?: string;
  capacityNote?: string;
}

export const RANCHI_INFRASTRUCTURE: InfrastructureFacility[] = [
  // ── Healthcare (≥3 entries: Hospital & PHC) ──
  {
    id: 'INF-HC-001',
    name: 'Rajendra Institute of Medical Sciences (RIMS)',
    infrastructureType: 'Hospital',
    category: 'Healthcare',
    lat: 23.3768,
    lng: 85.3533,
    ward: 'Ward 8',
    capacityNote: 'Tertiary multi-specialty regional hospital with 1500+ beds'
  },
  {
    id: 'INF-HC-002',
    name: 'Sadar District Hospital Ranchi',
    infrastructureType: 'Hospital',
    category: 'Healthcare',
    lat: 23.3664,
    lng: 85.3244,
    ward: 'Ward 18',
    capacityNote: 'District hospital with 500 beds, ICU, and 24x7 trauma care'
  },
  {
    id: 'INF-HC-003',
    name: 'Shaheed Chowk Urban Primary Health Centre Facility',
    infrastructureType: 'PHC',
    category: 'Healthcare',
    lat: 23.3710,
    lng: 85.3245,
    ward: 'Ward 18',
    capacityNote: 'Urban primary health centre with immunization and OPD'
  },
  {
    id: 'INF-HC-004',
    name: 'Doranda Community Health Centre',
    infrastructureType: 'PHC',
    category: 'Healthcare',
    lat: 23.3325,
    lng: 85.3271,
    ward: 'Ward 30',
    capacityNote: 'Primary community clinic serving southern municipal zones'
  },

  // ── Education (≥3 entries: Schools) ──
  {
    id: 'INF-ED-001',
    name: 'Ranchi Zila Government High School',
    infrastructureType: 'School',
    category: 'Education',
    lat: 23.3725,
    lng: 85.3218,
    ward: 'Ward 18',
    capacityNote: 'Senior secondary government school with 1200 student capacity'
  },
  {
    id: 'INF-ED-002',
    name: 'Government Girls High School Bariatu',
    infrastructureType: 'School',
    category: 'Education',
    lat: 23.3852,
    lng: 85.3512,
    ward: 'Ward 6',
    capacityNote: 'Secondary school with vocational training labs'
  },
  {
    id: 'INF-ED-003',
    name: 'Harmu Municipal Model Middle School',
    infrastructureType: 'School',
    category: 'Education',
    lat: 23.3540,
    lng: 85.3142,
    ward: 'Ward 26',
    capacityNote: 'Model middle school serving Harmu housing colony'
  },

  // ── Public Transport (≥2 entries: Bus Stops / Terminals) ──
  {
    id: 'INF-TR-001',
    name: 'Birsa Munda Bus Terminal Khadgarha',
    infrastructureType: 'Bus Stop',
    category: 'Public Transport',
    lat: 23.3612,
    lng: 85.3551,
    ward: 'Ward 15',
    capacityNote: 'Central inter-state and city transit interchange'
  },
  {
    id: 'INF-TR-002',
    name: 'ITF Transit Stand Ratu Road',
    infrastructureType: 'Bus Stop',
    category: 'Public Transport',
    lat: 23.3780,
    lng: 85.3090,
    ward: 'Ward 5',
    capacityNote: 'Regional commuter boarding hub connecting western suburbs'
  },

  // ── Water (≥2 entries: Water Points / Filtration Plants) ──
  {
    id: 'INF-WT-001',
    name: 'Gonda Hill Potable Water Reservoir & Treatment Hub',
    infrastructureType: 'Water Point',
    category: 'Water',
    lat: 23.3980,
    lng: 85.3175,
    ward: 'Ward 2',
    capacityNote: 'Municipal water distribution node supplying central zones'
  },
  {
    id: 'INF-WT-002',
    name: 'Hatia Dam Secondary Water Filtration Point',
    infrastructureType: 'Water Point',
    category: 'Water',
    lat: 23.2840,
    lng: 85.3105,
    ward: 'Ward 45',
    capacityNote: 'Southern municipal filtration and community tanker station'
  }
];
