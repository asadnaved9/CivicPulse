import { CountryConfig } from './index';

export const INDIA_CONFIG: CountryConfig = {
  code: 'IN',
  name: 'India',
  flag: '🇮🇳',
  currency: {
    code: 'INR',
    symbol: '₹',
    croreLakhFormat: true
  },
  adminHierarchy: {
    national: 'Union / National Level',
    stateOrProvince: 'State (e.g. Karnataka)',
    districtOrMunicipality: 'District / Urban Local Body (e.g. RMC)',
    wardOrSubPlace: 'Ward (e.g. Ward 151 - Koramangala)'
  },
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
  ],
  categories: [
    'Roads & Transit',
    'Water & Sewage',
    'Sanitation & Waste',
    'Healthcare & Clinics',
    'Education & Schools',
    'Electricity & Lighting',
    'Parks & Environment',
    'Skill Development'
  ],
  defaultWards: [
    'Koramangala 4th Block',
    'Koramangala 5th Block',
    'HSR Layout Sector 2',
    'HSR Layout Sector 3',
    'Indiranagar',
    'Whitefield'
  ],
  voiceProvider: 'bhashini',
  schemes: [
    {
      id: 'amrut',
      name: 'Atal Mission for Rejuvenation and Urban Transformation (AMRUT 2.0)',
      category: 'Water & Urban Infrastructure',
      content: 'Water supply universal metering, sewerage, faecal sludge management, stormwater drains, and green parks.'
    },
    {
      id: 'pmgsy',
      name: 'Pradhan Mantri Gram Sadak Yojana (PM-GSY)',
      category: 'Roads & Rural Transit',
      content: 'All-weather road construction, cross drainage culverts, and peri-urban feeder links connecting to highways.'
    },
    {
      id: 'sbm_urban',
      name: 'Swachh Bharat Mission (Urban 2.0)',
      category: 'Sanitation & Waste Management',
      content: 'Solid waste management facilities, biomining dumpsites, community pink toilets, and greywater management.'
    },
    {
      id: 'samagra_shiksha',
      name: 'Samagra Shiksha Abhiyan',
      category: 'Education Infrastructure',
      content: 'School building upgrade, digital smart classrooms, STEM labs, boundary walls, and drinking water in public schools.'
    },
    {
      id: 'nhm',
      name: 'National Health Mission (NHM - Urban Health)',
      category: 'Healthcare & Wellness',
      content: 'Urban Primary Health Centres (UPHCs), polyclinics, diagnostic testing services, and maternal-child health clinics.'
    }
  ]
};
