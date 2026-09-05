export interface DPIRollout {
  id: string;
  name: string;
  countryCode: 'IN' | 'ZA';
  launchYear: number;
  domain: string;
  currentAdoptionPct: number;
  targetAdoptionPct: number;
  totalBeneficiaries: string;
  relatedCategories: string[];
  sourceCitation: string;
}

export const DPI_ROLLOUTS: DPIRollout[] = [
  {
    id: 'in_aadhaar',
    name: 'Aadhaar (UIDAI Digital Identity)',
    countryCode: 'IN',
    launchYear: 2010,
    domain: 'Digital Identity & Authentication',
    currentAdoptionPct: 94.2,
    targetAdoptionPct: 98.0,
    totalBeneficiaries: '1.38 Billion',
    relatedCategories: ['Public Services', 'Healthcare', 'Welfare Distribution', 'General'],
    sourceCitation: 'UIDAI Monthly Dashboard 2024 & Ministry of Electronics and IT'
  },
  {
    id: 'in_upi',
    name: 'Unified Payments Interface (UPI)',
    countryCode: 'IN',
    launchYear: 2016,
    domain: 'Digital Financial Infrastructure',
    currentAdoptionPct: 83.5,
    targetAdoptionPct: 95.0,
    totalBeneficiaries: '450+ Million Active Users',
    relatedCategories: ['Electricity', 'Water', 'Municipal Taxes', 'Public Transport'],
    sourceCitation: 'National Payments Corporation of India (NPCI) Bulletin 2024'
  },
  {
    id: 'in_digilocker',
    name: 'DigiLocker (Paperless Document Wallet)',
    countryCode: 'IN',
    launchYear: 2015,
    domain: 'Credentials & Verifiable Claims',
    currentAdoptionPct: 62.0,
    targetAdoptionPct: 85.0,
    totalBeneficiaries: '270 Million Citizens',
    relatedCategories: ['Education', 'Transport Permits', 'Land Records'],
    sourceCitation: 'Digital India Annual Progress Report (MeitY)'
  },
  {
    id: 'in_cowin',
    name: 'CoWIN / U-WIN (Universal Immunization & Health)',
    countryCode: 'IN',
    launchYear: 2021,
    domain: 'Public Health Tracking & Universal Vaccines',
    currentAdoptionPct: 91.0,
    targetAdoptionPct: 95.0,
    totalBeneficiaries: '1.1 Billion Registered',
    relatedCategories: ['Healthcare', 'Maternal Care', 'Child Clinics'],
    sourceCitation: 'Ministry of Health and Family Welfare (MoHFW) Health Records'
  },
  {
    id: 'za_smart_id',
    name: 'Smart ID Card & HANIS System',
    countryCode: 'ZA',
    launchYear: 2013,
    domain: 'National Identity & Home Affairs',
    currentAdoptionPct: 68.4,
    targetAdoptionPct: 90.0,
    totalBeneficiaries: '25 Million Citizens',
    relatedCategories: ['Public Services', 'Social Grants (SASSA)', 'Electoral Access'],
    sourceCitation: 'Department of Home Affairs South Africa Annual Report 2023/24'
  }
];
