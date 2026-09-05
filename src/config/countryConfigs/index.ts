export interface CountryConfig {
  code: 'IN' | 'ZA';
  name: string;
  flag: string;
  currency: {
    code: string;
    symbol: string;
    croreLakhFormat: boolean;
  };
  adminHierarchy: {
    national: string;
    stateOrProvince: string;
    districtOrMunicipality: string;
    wardOrSubPlace: string;
  };
  supportedLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
  categories: string[];
  defaultWards: string[];
  voiceProvider: 'bhashini' | 'edge';
  schemes: Array<{
    id: string;
    name: string;
    category: string;
    content: string;
  }>;
}

import { INDIA_CONFIG } from './india';
import { SOUTH_AFRICA_CONFIG } from './southAfrica';

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  IN: INDIA_CONFIG,
  ZA: SOUTH_AFRICA_CONFIG
};

export function getCountryConfig(code?: string): CountryConfig {
  const selected = (code || (typeof window !== 'undefined' ? localStorage.getItem('civicpulse_country') : null) || 'IN').toUpperCase();
  return COUNTRY_CONFIGS[selected] || INDIA_CONFIG;
}

export function getAvailableCountries(): Array<{ code: string; name: string; flag: string }> {
  return [
    { code: 'IN', name: INDIA_CONFIG.name, flag: INDIA_CONFIG.flag },
    { code: 'ZA', name: SOUTH_AFRICA_CONFIG.name, flag: SOUTH_AFRICA_CONFIG.flag }
  ];
}
