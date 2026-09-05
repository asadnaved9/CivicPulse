export interface MunicipalAsset {
  id: string;
  name: string;
  category: 'road' | 'streetlight' | 'water' | 'electricity' | 'waste' | 'facility';
  condition: 'healthy' | 'maintenance_due' | 'critical' | 'out_of_service';
  lat: number;
  lng: number;
  address: string;
  ward: string;
  department: string;
  installDate: string;
  lastInspectionDate: string;
  activeComplaintsCount: number;
  healthScore: number; // 0 - 100
  specifications: string;
}

export const RANCHI_MUNICIPAL_ASSETS: MunicipalAsset[] = [
  {
    id: 'AST-RD-101',
    name: 'Mahatma Gandhi Main Road Bituminous Transit Segment #4',
    category: 'road',
    condition: 'critical',
    lat: 23.3698,
    lng: 85.3252,
    address: 'Near Albert Ekka Chowk, Main Road, Ward 18, Ranchi',
    ward: 'Ward 18',
    department: 'Road Construction Department (RCD)',
    installDate: '2021-03-15',
    lastInspectionDate: '2026-08-20',
    activeComplaintsCount: 3,
    healthScore: 32,
    specifications: 'Heavy-duty 4-lane Bituminous Concrete pavement; 1.2km span'
  },
  {
    id: 'AST-SL-204',
    name: 'Daily Market High-Mast LED Lighting Mast #07',
    category: 'streetlight',
    condition: 'maintenance_due',
    lat: 23.3615,
    lng: 85.3228,
    address: 'Daily Market Crossing, Ward 18, Ranchi',
    ward: 'Ward 18',
    department: 'Ranchi Municipal Corporation (RMC) Electrical Cell',
    installDate: '2022-11-10',
    lastInspectionDate: '2026-08-14',
    activeComplaintsCount: 1,
    healthScore: 58,
    specifications: '16-meter High Mast tower with 8x 250W Philips IP66 LED modules'
  },
  {
    id: 'AST-WT-305',
    name: 'Kadru Diversion Main Potable Transmission Pipeline #2',
    category: 'water',
    condition: 'healthy',
    lat: 23.3512,
    lng: 85.3278,
    address: 'Overbridge Chowk, Kadru Diversion Rd, Ward 12, Ranchi',
    ward: 'Ward 12',
    department: 'Drinking Water & Sanitation Department (DWSD)',
    installDate: '2020-07-22',
    lastInspectionDate: '2026-09-02',
    activeComplaintsCount: 0,
    healthScore: 91,
    specifications: '450mm Ductile Iron (DI) Class K9 pressurized supply pipe'
  },
  {
    id: 'AST-EL-408',
    name: 'Church Road 11kV Overhead Power Feeder Corridor',
    category: 'electricity',
    condition: 'critical',
    lat: 23.3640,
    lng: 85.3310,
    address: 'Church Road, near GEL Church Complex, Ward 14, Ranchi',
    ward: 'Ward 14',
    department: 'Jharkhand Bijli Vitran Nigam Limited (JBVNL)',
    installDate: '2018-05-19',
    lastInspectionDate: '2026-08-28',
    activeComplaintsCount: 2,
    healthScore: 41,
    specifications: '11kV ACSR Dog-conductor overhead feeder with pin insulators'
  },
  {
    id: 'AST-WS-502',
    name: 'Hindpiri Secondary Solid Waste Compactor & Sorting Station',
    category: 'waste',
    condition: 'maintenance_due',
    lat: 23.3582,
    lng: 85.3195,
    address: 'Second Street, Hindpiri, Ward 17, Ranchi',
    ward: 'Ward 17',
    department: 'RMC Solid Waste Management Cell',
    installDate: '2023-01-18',
    lastInspectionDate: '2026-08-10',
    activeComplaintsCount: 2,
    healthScore: 64,
    specifications: 'Hydraulic stationary refuse compactor unit; 8 metric ton capacity'
  },
  {
    id: 'AST-FC-601',
    name: 'Shaheed Chowk Urban Primary Health Centre Facility',
    category: 'facility',
    condition: 'healthy',
    lat: 23.3710,
    lng: 85.3245,
    address: 'Shaheed Chowk, Ward 18, Ranchi',
    ward: 'Ward 18',
    department: 'Health, Medical Education & Family Welfare Dept',
    installDate: '2019-10-05',
    lastInspectionDate: '2026-08-01',
    activeComplaintsCount: 0,
    healthScore: 88,
    specifications: 'G+2 RCC structure with 30-bed observation ward and cold-chain room'
  },
  {
    id: 'AST-RD-109',
    name: 'Circular Road Commercial Corridor Asphalt Layer',
    category: 'road',
    condition: 'maintenance_due',
    lat: 23.3740,
    lng: 85.3350,
    address: 'Lalpur to Nucleus Mall stretch, Ward 10, Ranchi',
    ward: 'Ward 10',
    department: 'Road Construction Department (RCD)',
    installDate: '2022-04-12',
    lastInspectionDate: '2026-07-29',
    activeComplaintsCount: 1,
    healthScore: 61,
    specifications: 'Dense Bituminous Macadam (DBM) with stone matrix asphalt surfacing'
  },
  {
    id: 'AST-WT-312',
    name: 'Harmu River Stormwater Concrete Drainage Canal #1',
    category: 'water',
    condition: 'critical',
    lat: 23.3520,
    lng: 85.3120,
    address: 'Harmu Bypass Corridor, Ward 26, Ranchi',
    ward: 'Ward 26',
    department: 'Urban Development & Housing Department (UDHD)',
    installDate: '2017-09-30',
    lastInspectionDate: '2026-08-12',
    activeComplaintsCount: 3,
    healthScore: 38,
    specifications: 'Trapezoidal concrete lined flood catchment channel; 3.5m breadth'
  }
];
