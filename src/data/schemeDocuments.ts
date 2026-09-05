export interface SchemeDocument {
  id: string;            // e.g. 'amrut'
  name: string;          // full official name
  category: string;      // relevant domain
  content: string;       // official purpose, eligible project types, funding ratio, criteria
}

/**
 * Hand-curated government scheme eligibility guidelines pulled directly from official ministries:
 * - AMRUT (Ministry of Housing and Urban Affairs - MoHUA)
 * - PM-GSY (Ministry of Rural Development)
 * - Swachh Bharat Mission (Urban) (MoHUA)
 * - Samagra Shiksha (Ministry of Education)
 * - National Health Mission (Ministry of Health and Family Welfare)
 */
export const SCHEME_DOCUMENTS: SchemeDocument[] = [
  {
    id: "amrut",
    name: "Atal Mission for Rejuvenation and Urban Transformation (AMRUT 2.0)",
    category: "Water & Urban Infrastructure",
    content: `The Atal Mission for Rejuvenation and Urban Transformation (AMRUT 2.0) was launched by the Ministry of Housing and Urban Affairs (MoHUA) to provide universal coverage of water supply through functional taps to all households in all statutory towns, and universal coverage of sewerage and septage management in 500 AMRUT cities.

Eligible Project Components:
1. Water Supply: Augmentation of existing water supply systems, water treatment plants (WTP), universal metering, and rehabilitation of old distribution networks.
2. Sewerage & Septage Management: Decentralized sewage treatment plants (STPs), faecal sludge management, recycling and reuse of treated wastewater.
3. Stormwater Drainage: Construction and improvement of drains and stormwater channels to eliminate chronic urban waterlogging.
4. Green Spaces & Parks: Development of pedestrian-friendly public parks, walking tracks, and eco-restoration of water bodies and lakes.

Funding Patterns & Criteria:
- For cities with population over 10 lakh: Central share is 25% of the project cost; State and Urban Local Body (ULB) share is 75%.
- For cities with population between 1 and 10 lakh: Central share is 33.3%; State and ULB contribute 66.7%.
- For cities with population under 1 lakh: Central share is 50%.
- Eligible applicants: Urban Local Bodies (ULBs), municipal corporations (such as RMC), and state water boards.`
  },
  {
    id: "pmgsy",
    name: "Pradhan Mantri Gram Sadak Yojana (PM-GSY)",
    category: "Roads & Rural Transit",
    content: `Pradhan Mantri Gram Sadak Yojana (PM-GSY) is a nationwide centrally-sponsored plan in India under the Ministry of Rural Development to provide good all-weather road connectivity to unconnected rural and peri-urban habitations.

Eligible Project Components:
1. All-Weather Road Construction: Upgradation of earthen tracks to black-topped bitumen or concrete all-weather roads.
2. Cross Drainage Structures: Construction of culverts, small bridges, and side masonry drains to ensure year-round navigability during monsoon conditions.
3. Peri-Urban Feeder Links: Upgradation of designated Through Routes and Major Rural Links connecting settlements to primary state highways, markets, and healthcare hubs.

Funding Patterns & Eligibility:
- Funding Ratio: 60% Central Government and 40% State Government for standard states; 90:10 for North-Eastern and Himalayan regions.
- Eligibility Criteria: Focuses on core network habitations. Roads must adhere to Indian Roads Congress (IRC) rural roads standards with mandatory 5-year maintenance contracts incorporated into the capital project tender.`
  },
  {
    id: "sbm_urban",
    name: "Swachh Bharat Mission (Urban 2.0)",
    category: "Sanitation & Waste Management",
    content: `Swachh Bharat Mission (Urban 2.0) is implemented by the Ministry of Housing and Urban Affairs (MoHUA) with the vision of achieving 'Garbage Free' status for all statutory towns and cities across India.

Eligible Project Components:
1. Solid Waste Management: Setting up of automated Material Recovery Facilities (MRFs), waste-to-energy processing units, and bio-methanation/composting kiosks for organic wet waste.
2. Remediation of Legacy Dumpsites: 100% bio-remediation and biomining of legacy waste dumpsites to reclaim prime municipal land.
3. Sanitation & Public Conveniences: Construction of community toilets, public toilets, and aspirational pink toilets with modern hygienic amenities.
4. Used Water Management: Treatment and safe disposal of greywater in statutory towns with population less than 1 lakh.

Funding Patterns:
- Cities with population > 10 Lakh: 25% Central assistance, balance funded through State share and ULB internal revenue/CSR.
- Cities with population 1 to 10 Lakh: 33% Central assistance.
- Towns with population < 1 Lakh: 50% Central share.
- Mandatory condition: Door-to-door source segregation (wet, dry, domestic hazardous) and elimination of single-use plastics.`
  },
  {
    id: "samagra_shiksha",
    name: "Samagra Shiksha Abhiyan",
    category: "Education",
    content: `Samagra Shiksha is an overarching programme for the school education sector extending from pre-school to class 12, prepared with the broader goal of improving school effectiveness measured in terms of equal opportunities for schooling and equitable learning outcomes under the Ministry of Education.

Eligible Project Components:
1. Infrastructure Strengthening: Additional classrooms, science labs, computer laboratories, girl-child sanitation blocks, clean drinking water filtration systems, and solar power installations in government primary and secondary schools.
2. Digital Initiatives (ICT): Digital classrooms, smart boards, tablets, and vocational skill laboratories.
3. Inclusive Education: Barrier-free access, ramps with handrails, and assistive educational devices for children with special needs (CWSN).
4. Sports & Physical Infrastructure: Playground development, sports equipment provision, and perimeter security boundary walls.

Funding Patterns:
- Funding Ratio: 60% Central share and 40% State share for general category states (90:10 for NE/Himalayan states).
- Implementation: Managed through State Implementation Societies (Samagra Shiksha) and municipal school boards.`
  },
  {
    id: "nhm",
    name: "National Health Mission (NHM - National Urban Health Mission)",
    category: "Healthcare",
    content: `The National Health Mission (NHM) and its sub-mission the National Urban Health Mission (NUHM) under the Ministry of Health and Family Welfare aim to address the healthcare needs of the urban population with focus on urban poor, slum dwellers, and vulnerable groups.

Eligible Project Components:
1. Primary Health Infrastructure: Establishment and upgradation of Urban Primary Health Centres (U-PHCs) and Urban Community Health Centres (U-CHCs), including 24/7 maternity and emergency triage services.
2. Diagnostic & Pharmacy Strengthening: Procurement of semi-automated biochemistry analyzers, clean cold-chain storage for vaccines, and Jan Aushadhi generic drug dispensing kiosks.
3. Ayushman Arogya Mandir (Health & Wellness Centres): Conversion of local dispensaries into comprehensive health centres delivering 12 packages of preventive, promotive, and curative care.
4. Mobile Medical Units (MMUs): Deployment of mobile clinic vans to underserved urban settlements and migrant labor colonies.

Funding Patterns:
- Funding Ratio: 60:40 between Central and State Governments (90:10 for Special Category states).
- Criteria: One U-PHC per 50,000 population in urban areas; prioritized within 1-2 km reach of vulnerable slum clusters.`
  }
];
