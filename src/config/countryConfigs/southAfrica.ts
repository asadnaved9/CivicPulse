import { CountryConfig } from './index';

export const SOUTH_AFRICA_CONFIG: CountryConfig = {
  code: 'ZA',
  name: 'South Africa',
  flag: '🇿🇦',
  currency: {
    code: 'ZAR',
    symbol: 'R',
    croreLakhFormat: false // Standard millions/thousands format
  },
  adminHierarchy: {
    national: 'National Government',
    stateOrProvince: 'Province (e.g. Gauteng, Western Cape)',
    districtOrMunicipality: 'Metropolitan Municipality (e.g. City of Johannesburg, eThekwini)',
    wardOrSubPlace: 'Municipal Ward / Sub-Place (e.g. Ward 60 - Hillbrow)'
  },
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zu', name: 'isiZulu', nativeName: 'isiZulu' },
    { code: 'xh', name: 'isiXhosa', nativeName: 'isiXhosa' },
    { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' }
  ],
  categories: [
    'Roads & Stormwater',
    'Water & Sanitation (Bulk Supply)',
    'Electricity & Load-Reduction Solar',
    'Primary Healthcare Clinics',
    'Public Safety & Community Watch',
    'Early Childhood Development',
    'Refuse Removal & Landfill',
    'Youth Employment (YES)'
  ],
  defaultWards: [
    'Ward 60 (Johannesburg Central / Hillbrow)',
    'Ward 115 (Fourways / Douglasdale)',
    'Ward 58 (Fordsburg / Mayfair)',
    'Ward 77 (Cape Town City Bowl)',
    'Ward 54 (Sea Point / Camps Bay)'
  ],
  voiceProvider: 'edge',
  schemes: [
    {
      id: 'mig_za',
      name: 'Municipal Infrastructure Grant (MIG - CoGTA)',
      category: 'Bulk Municipal Infrastructure',
      content: 'National conditional grant eradicating municipal infrastructure backlogs for poor households in water, sanitation, and municipal roads.'
    },
    {
      id: 'wsig_za',
      name: 'Water Services Infrastructure Grant (WSIG)',
      category: 'Water & Sanitation Security',
      content: 'Department of Water and Sanitation grant funding borehole development, reticulation networks, and reservoir upgrades.'
    },
    {
      id: 'inep_za',
      name: 'Integrated National Electrification Programme (INEP)',
      category: 'Electricity & Grid Security',
      content: 'Department of Mineral Resources and Energy capital programme for household grid connections and mini-grid solar installations.'
    },
    {
      id: 'epwp_za',
      name: 'Expanded Public Works Programme (EPWP)',
      category: 'Community Infrastructure & Jobs',
      content: 'Nationwide government programme drawing unemployed citizens into productive work maintaining roads, parks, and waste management.'
    },
    {
      id: 'nhis_za',
      name: 'National Health Insurance Infrastructure Grant (NHI Facility Upgrade)',
      category: 'Primary Healthcare Upgrades',
      content: 'Conditional funding to bring primary healthcare clinics to ideal clinic status with emergency rooms and maternal wards.'
    }
  ]
};
