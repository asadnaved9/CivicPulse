import { collection, getDocs, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper to calculate relative timestamp
function daysAgo(num: number) {
  const date = new Date();
  date.setDate(date.getDate() - num);
  return date;
}

export const RANCHI_ISSUES = [
  // Main Road & Hindpiri / Daily Market (8 issues)
  {
    title: "Severe Road Potholes on Mahatma Gandhi Main Road",
    description: "Huge series of deep craters and broken asphalt right in the middle of the active traffic corridor near Albert Ekka Chowk. Two-wheelers and auto-rickshaws frequently skid during peak traffic hours.",
    category: "pothole",
    severity: 5,
    severityReason: "Located on Ranchi's central arterial transit road, presenting direct risk of vehicle damage and severe accident injury to commuter traffic.",
    status: "verified",
    lat: 23.3698,
    lng: 85.3252,
    address: "Mahatma Gandhi Main Rd, near Albert Ekka Chowk, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_severe_dangerous_road_potholes_on_main_road_ranchi_deep_holes_active_traffic_lane_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_smoothly_repaired_and_newly_asphalted_road_on_main_road_ranchi_with_no_potholes_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user2", "user3", "user4"],
    verified: true,
    verificationReason: "AI image match confirms severe road surface distress. Validated by multiple citizen logs.",
    aiTags: ["road-damage", "pothole", "accident-risk", "traffic-disruption"],
    estimatedResolutionDays: 4,
    escalated: false,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2)
  },
  {
    title: "Broken High-Mast Streetlight Near Daily Market",
    description: "The high-mast municipal lighting pole has been completely non-functional for over a week. The commercial crossing is pitch dark at night, making it unsafe for pedestrians and night vendors.",
    category: "streetlight",
    severity: 3,
    severityReason: "Pedestrian safety concern in crowded market zone; elevated risk of localized petty crime and falls.",
    status: "in_progress",
    lat: 23.3615,
    lng: 85.3228,
    address: "Daily Market Chowk, Main Road, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_dark_commercial_street_at_night_near_daily_market_ranchi_with_a_broken_dead_streetlight_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_brightly_lit_street_at_night_near_daily_market_ranchi_with_a_working_led_streetlight_casting_vibrant_white_light_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user3", "user5", "user7", "user8", "user9"],
    verified: true,
    verificationReason: "Night illumination failure confirmed. Escalated to Ranchi Municipal Corporation (RMC) electrical cell.",
    aiTags: ["streetlight", "darkness", "safety-hazard"],
    estimatedResolutionDays: 3,
    escalated: false,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3)
  },
  {
    title: "Overflowing Garbage Dump Near Hindpiri Second Street",
    description: "Heavy accumulation of municipal solid food and vegetable waste dumped on roadside. Foul stench is overwhelming and stray cattle are tearing garbage bags apart.",
    category: "waste",
    severity: 4,
    severityReason: "Public sanitation and health hazard in dense residential zone; attracts disease vectors and blocks street entrance.",
    status: "reported",
    lat: 23.3582,
    lng: 85.3195,
    address: "Second Street, Hindpiri, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_an_overflowing_commercial_garbage_dumpster_on_the_pavement_with_scattered_solid_food_waste_and_litter_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_clean_swept_and_empty_concrete_pavement_with_no_trash_or_dumpster_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user4"],
    verified: false,
    verificationReason: "",
    aiTags: ["garbage-dump", "public-health", "sanitation-hazard"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },
  {
    title: "Burst Drinking Water Pipeline Flooding Street",
    description: "A major municipal potable water supply pipe burst early this morning near Overbridge junction. Clean drinking water is gushing across the road and flooding residential entryways.",
    category: "water",
    severity: 5,
    severityReason: "Critical resource loss of purified municipal water and active road surface erosion.",
    status: "resolved",
    lat: 23.3512,
    lng: 85.3278,
    address: "Overbridge Chowk, Kadru Diversion Rd, Ranchi, Jharkhand 834002",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_broken_water_main_pipe_bursting_with_a_huge_high_pressure_water_geyser_flooding_residential_garages_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_repaired_water_main_pipe_under_ground_dry_and_clean_residential_road_with_no_flooding_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user2", "user4", "user5", "user6"],
    verified: true,
    verificationReason: "High pressure hydro-leak confirmed. Emergency DWSD repair squad dispatched and replaced damaged collar.",
    aiTags: ["water-leak", "potable-water", "flooding"],
    estimatedResolutionDays: 1,
    escalated: false,
    createdAt: daysAgo(4),
    resolvedAt: daysAgo(2),
    updatedAt: daysAgo(2)
  },
  {
    title: "Dangling High-Tension Overhead Power Wire",
    description: "Snapping of service electrical cable after storm; live wires hanging just 6 feet above busy pedestrian walking zone on Church Road.",
    category: "other",
    severity: 5,
    severityReason: "High probability of electrocution for pedestrians. Critical life-safety emergency.",
    status: "reported",
    lat: 23.3664,
    lng: 85.3268,
    address: "Church Road Crossing, Main Road, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_dangerous_exposed_high_voltage_electrical_power_cables_hanging_dangerously_low_above_a_wet_footpath_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_safely_bundled_and_securely_elevated_utility_power_lines_high_up_on_a_utility_pole_above_a_safe_pedestrian_sidewalk_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user3", "user4", "user6", "user7", "user8", "user10"],
    verified: false,
    verificationReason: "",
    aiTags: ["exposed-wire", "power-hazard", "jbvnl-alert"],
    estimatedResolutionDays: 1,
    escalated: true,
    escalatedAt: daysAgo(2),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2)
  },
  {
    title: "Fallen Sissoo Tree Blocking Approach Road",
    description: "A large roadside sissoo tree uprooted during thunderstorm last night, completely obstructing vehicular traffic on Club Road.",
    category: "other",
    severity: 4,
    severityReason: "Full road cutoff preventing emergency services and neighborhood traffic movement.",
    status: "resolved",
    lat: 23.3562,
    lng: 85.3235,
    address: "Club Road, near Ranchi Club, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_huge_fallen_tree_completely_blocking_two_lanes_of_a_residential_street_after_a_heavy_storm_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_clear_residential_street_with_no_branches_the_fallen_tree_completely_removed_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user5", "user9"],
    verified: true,
    verificationReason: "Transit block verified. RMC emergency disaster team cleared tree with hydraulic saws.",
    aiTags: ["fallen-tree", "transit-block", "storm-debris"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(6),
    resolvedAt: daysAgo(5),
    updatedAt: daysAgo(5)
  },
  {
    title: "Choked Stormwater Drain Spilling Waste",
    description: "Roadside concrete drain completely clogged with plastic bottles, silt and wrappers near GEL Church Complex, causing filthy black water backflow.",
    category: "water",
    severity: 4,
    severityReason: "Elevated risk of infectious water-borne disease and foul backwater spilling over shopping footpaths.",
    status: "verified",
    lat: 23.3642,
    lng: 85.3245,
    address: "Behind GEL Church Complex, Main Road, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_roadside_stormwater_drain_completely_clogged_with_plastic_bottles_and_garbage_black_water_overflowing_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_clean_repaired_roadside_drainage_grate_and_clear_flowing_water_with_no_plastic_trash_or_blockage_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user5", "user7"],
    verified: true,
    verificationReason: "AI image detection flags 85% volumetric blockage. RMC drainage super-sucker deployed.",
    aiTags: ["drain-block", "wastewater", "sanitation"],
    estimatedResolutionDays: 3,
    escalated: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3)
  },
  {
    title: "Broken Footpath Pavers and Open Drain Cavity",
    description: "Footpath pavers shattered and a drainage slab collapsed opposite Roshpa Tower, creating a hidden 3-foot fall hazard for shoppers.",
    category: "other",
    severity: 3,
    severityReason: "Direct physical hazard on heavy commercial sidewalk; high trip and injury potential.",
    status: "reported",
    lat: 23.3630,
    lng: 85.3248,
    address: "Opposite Roshpa Tower, Main Road, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_broken_cracked_and_buckled_interlocking_concrete_pavers_on_a_city_pedestrian_footpath_uneven_ground_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_newly_laid_perfectly_flat_intact_interlocking_concrete_paver_blocks_on_a_clean_city_footpath_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user8"],
    verified: false,
    verificationReason: "",
    aiTags: ["footpath", "open-slab", "pedestrian-hazard"],
    estimatedResolutionDays: 5,
    escalated: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },

  // Lalpur & Circular Road (7 issues)
  {
    title: "Dark Blind Turn on Circular Road near Lalpur Chowk",
    description: "Multiple sodium streetlights non-operational on Circular Road towards Peace Road, plunging a key commuter turn into pitch darkness.",
    category: "streetlight",
    severity: 4,
    severityReason: "High student commuter density around Lalpur; major vehicular accident hazard at night.",
    status: "reported",
    lat: 23.3768,
    lng: 85.3375,
    address: "Circular Rd near Lalpur Chowk, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_pitch_black_highway_curve_on_double_road_at_night_with_broken_non_functional_street_lamps_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_double_road_at_night_brightly_illuminated_by_five_consecutive_glowing_white_led_streetlights_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user4", "user6", "user8", "user10", "user11"],
    verified: false,
    verificationReason: "",
    aiTags: ["streetlight", "student-safety", "circular-road"],
    estimatedResolutionDays: 3,
    escalated: true,
    escalatedAt: daysAgo(1),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1)
  },
  {
    title: "Raw Sewage Overflow Near Nucleus Mall",
    description: "Underground sewer line manhole bubbling dirty sewage onto Circular Road pavement right outside commercial premises.",
    category: "water",
    severity: 5,
    severityReason: "Severe public health and hygiene hazard in major retail district; pedestrian access completely fouled.",
    status: "verified",
    lat: 23.3742,
    lng: 85.3340,
    address: "Circular Rd, near Nucleus Mall, Lalpur, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_smelly_dark_sewage_water_bubbling_up_from_a_manhole_on_100_feet_road_flowing_onto_the_pavement_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_sealed_iron_manhole_cover_on_a_completely_dry_clean_asphalt_street_with_no_leakage_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user2", "user3"],
    verified: true,
    verificationReason: "Trunk sewer choke verified. Emergency jetting machine deployed to clear silt.",
    aiTags: ["sewage", "nucleus-mall", "public-health"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2)
  },
  {
    title: "Dangerous Road Depression Near Women's College",
    description: "A wide asphalt depression measuring 5 feet across and 7 inches deep has formed after pipe trenching on Circular Road. Scooters brake violently.",
    category: "pothole",
    severity: 4,
    severityReason: "Located directly outside college entrance, putting thousands of daily students and two-wheeler riders at risk.",
    status: "in_progress",
    lat: 23.3725,
    lng: 85.3328,
    address: "Circular Road, opposite Ranchi Women's College, Ranchi 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_huge_four_foot_wide_six_inch_deep_pothole_on_busy_asphalt_road_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_freshly_repaired_filled_and_patched_flat_black_asphalt_pothole_restored_road_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user4", "user5", "user7", "user9"],
    verified: true,
    verificationReason: "Road engineering assessment confirmed deep structural deformation. Temporary cold-mix patch underway.",
    aiTags: ["pothole", "college-zone", "accident-risk"],
    estimatedResolutionDays: 4,
    escalated: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2)
  },
  {
    title: "Unauthorized Commercial Packaging Waste Dump",
    description: "Coaching centers and retail shops dumping large volumes of polythene, broken furniture, and packaging boxes along Karamtoli road edge.",
    category: "waste",
    severity: 4,
    severityReason: "Flammable debris pile choking road shoulder and degrading urban cleanliness.",
    status: "reported",
    lat: 23.3795,
    lng: 85.3382,
    address: "Karamtoli Road, near Lalpur, Ranchi, Jharkhand 834008",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_piles_of_illegal_electronic_waste_old_monitors_batteries_keyboards_dumped_by_the_grassy_service_lane_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_completely_rehabilitated_clean_grassy_service_lane_with_all_e_waste_cleared_and_swept_tidy_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user3"],
    verified: false,
    verificationReason: "",
    aiTags: ["waste-dump", "sanitation", "karamtoli"],
    estimatedResolutionDays: 4,
    escalated: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },
  {
    title: "Broken Distribution Feeder Box on Footpath",
    description: "An electrical distributor pillar box is bent open with loose high-load wires accessible on student pedestrian pavement.",
    category: "other",
    severity: 3,
    severityReason: "Safety hazard in high-traffic coaching student corridor; needs immediate enclosure.",
    status: "resolved",
    lat: 23.3752,
    lng: 85.3398,
    address: "Peace Road, Lalpur, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_an_optical_fiber_junction_box_hanging_brokenly_open_on_a_brick_wall_with_loose_telecom_wires_dangling_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_repaired_securely_locked_new_metal_cable_box_mounted_on_the_wall_with_tidy_secured_wiring_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user5"],
    verified: true,
    verificationReason: "Electrical box cabinet replaced and re-keyed by JBVNL maintenance squad.",
    aiTags: ["feeder-box", "electrical-hazard", "peace-road"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(5),
    resolvedAt: daysAgo(3),
    updatedAt: daysAgo(3)
  },
  {
    title: "Water Sluice Valve Leak Damaging Road Foundation",
    description: "Continuous water spray from broken municipal valve flooding Burdwan Compound lane and washing away road asphalt.",
    category: "water",
    severity: 4,
    severityReason: "Persistent drinking water wastage and road foundation weakening.",
    status: "resolved",
    lat: 23.3710,
    lng: 85.3355,
    address: "Burdwan Compound, Lalpur, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_broken_yellow_fire_hydrant_gushing_a_high_pressure_spray_of_clean_water_all_over_the_roadway_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_capped_and_sealed_repaired_yellow_fire_hydrant_with_completely_dry_ground_and_no_spraying_water_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user4", "user6", "user10"],
    verified: true,
    verificationReason: "Sluice valve packing replaced by municipal water department.",
    aiTags: ["valve-leak", "road-damage", "burdwan-compound"],
    estimatedResolutionDays: 1,
    escalated: false,
    createdAt: daysAgo(7),
    resolvedAt: daysAgo(6),
    updatedAt: daysAgo(6)
  },
  {
    title: "Open Smoldering Garbage in Residential Colony",
    description: "Leaves and plastic waste being burned in open plot near Commissioner Compound, generating suffocating toxic smoke for nearby apartments.",
    category: "waste",
    severity: 4,
    severityReason: "Severe smoke inhalation danger for infants and asthma patients in colony.",
    status: "verified",
    lat: 23.3685,
    lng: 85.3312,
    address: "Old Commissioner's Compound Road, Ranchi, Jharkhand 834001",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_sweepings_and_plastic_garbage_burning_in_the_open_in_front_of_apartment_buildings_with_thick_toxic_smoke_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_vacant_clean_open_plot_where_garbage_burning_stopped_neatly_swept_and_fenced_with_fresh_grass_planted_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user3", "user5"],
    verified: true,
    verificationReason: "Waste burning violation confirmed. Ward sanitation marshals intervened.",
    aiTags: ["smoke-hazard", "open-burning", "air-quality"],
    estimatedResolutionDays: 1,
    escalated: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3)
  },

  // Doranda & Hinoo / Airport Corridor (5 issues)
  {
    title: "Flooded Railway Culvert Underpass at Doranda",
    description: "Every monsoon downpour causes the railway underpass near Doranda to submerge under 3 feet of rainwater, cutting off access.",
    category: "water",
    severity: 5,
    severityReason: "Complete disruption of vital south Ranchi commuter artery connecting Doranda and Hatia.",
    status: "reported",
    lat: 23.3385,
    lng: 85.3210,
    address: "Railway Underpass Rd, Doranda, Ranchi, Jharkhand 834002",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_road_under_railway_bridge_severely_flooded_with_three_feet_of_dirty_water_submerged_car_tires_traffic_jam_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_completely_dry_fully_drained_smooth_roadway_under_railway_bridge_with_new_side_stormwater_gutters_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user2", "user3", "user4", "user5", "user6", "user7", "user8"],
    verified: false,
    verificationReason: "",
    aiTags: ["water-logging", "underpass", "doranda-transit"],
    estimatedResolutionDays: 5,
    escalated: true,
    escalatedAt: daysAgo(3),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(3)
  },
  {
    title: "Large Crater Pothole on Airport Road Near Hinoo",
    description: "Massive crater on the main route to Birsa Munda Airport. Speeding airport taxis brake abruptly, creating continuous near-collision risks.",
    category: "pothole",
    severity: 4,
    severityReason: "High-speed transit road linking city to Birsa Munda Airport; severe danger for night travellers.",
    status: "reported",
    lat: 23.3280,
    lng: 85.3240,
    address: "Airport Road, near Hinoo Chowk, Ranchi, Jharkhand 834002",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_giant_deep_crater_pothole_on_the_asphalt_of_airport_road_disrupting_heavy_traffic_daytime_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_perfectly_re_paved_smooth_asphalt_roadway_on_airport_road_where_the_giant_crater_was_filled_and_patched_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user5"],
    verified: false,
    verificationReason: "",
    aiTags: ["crater", "airport-road", "hinoo-transit"],
    estimatedResolutionDays: 3,
    escalated: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },
  {
    title: "Tilting Highway Light Pole Over Birsa Chowk Flyover",
    description: "Rusted streetlight pole leaning at an acute angle over the descent lane towards Birsa Chowk, threatening to collapse in strong winds.",
    category: "streetlight",
    severity: 4,
    severityReason: "Severe risk of heavy metallic pole collapse over high-speed flyover traffic.",
    status: "in_progress",
    lat: 23.3215,
    lng: 85.3125,
    address: "Birsa Chowk Flyover descent, Ranchi, Jharkhand 834002",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_rusted_metal_street_light_pole_bent_and_leaning_dangerously_low_over_outer_ring_road_highway_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_sturdy_brand_new_straight_galvanized_steel_highway_streetlight_pole_with_modern_led_light fixture_on_outer_ring_road_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user3", "user6", "user8"],
    verified: true,
    verificationReason: "Structural deflection validated. RMC technical wing dispatched crane to safely anchor pole.",
    aiTags: ["structural-hazard", "pole-collapse", "birsa-chowk"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2)
  },
  {
    title: "Construction Rubble Dumped by Subarnarekha River Bank",
    description: "Truckloads of broken concrete and construction demolition debris dumped illegally along river approach road near Namkum bridge.",
    category: "waste",
    severity: 3,
    severityReason: "Encroachment of river flood basin and obstruction of public riverside track.",
    status: "resolved",
    lat: 23.3420,
    lng: 85.3412,
    address: "Subarnarekha River Bank Rd, Namkum link, Ranchi, Jharkhand 834010",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_multiple_truckloads_of_broken_concrete_bricks_debris_illegally_dumped_on_lake_walking_path_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_cleared_tidy_brick_walking_trail_by_the_lake_with_all_demolition_debris_removed_scenic_lakeview_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user5", "user7"],
    verified: true,
    verificationReason: "Encroachment cleared by municipal earthmovers; penalty notice served.",
    aiTags: ["debris", "river-protection", "illegal-dumping"],
    estimatedResolutionDays: 4,
    escalated: false,
    createdAt: daysAgo(10),
    resolvedAt: daysAgo(7),
    updatedAt: daysAgo(7)
  },
  {
    title: "Water Tanker Spilling Muddy Sludge on Harmu Bypass",
    description: "Construction tankers leaking muddy soil slurry along Harmu Housing Colony main road, creating dangerous skidding conditions.",
    category: "water",
    severity: 3,
    severityReason: "Slippery red soil slurry on asphalt poses severe crash risk to two-wheelers.",
    status: "verified",
    lat: 23.3550,
    lng: 85.3050,
    address: "Harmu Housing Colony Bypass Road, Ranchi, Jharkhand 834002",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_wet_muddy_clay_and_slush_spilled_all_over_the_asphalt_slick_dangerous_mud_streaks_ranchi_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_washed_clean_and_completely_dry_asphalt_highway_with_no_mud_streaks_ranchi_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user4", "user9"],
    verified: true,
    verificationReason: "Spill hazard confirmed; traffic squad mobilized water tender to flush road surface.",
    aiTags: ["sludge-spill", "skid-hazard", "harmu-bypass"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2)
  }
];

export const BANGALORE_ISSUES = RANCHI_ISSUES; // Backward-compatibility alias

export const SEED_USERS = [
  { uid: "leader1", displayName: "Deepak Oraon", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=deepak", points: 1540, badges: ["First Report", "Civic Champion", "Community Guardian", "Truth Teller"], issuesReported: 18, issuesResolved: 12 },
  { uid: "leader2", displayName: "Anjali Gupta", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=anjali", points: 840, badges: ["First Report", "Civic Champion", "Truth Teller"], issuesReported: 9, issuesResolved: 5 },
  { uid: "leader3", displayName: "Sanjay Tirkey", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=sanjay", points: 650, badges: ["First Report", "Civic Champion"], issuesReported: 6, issuesResolved: 4 },
  { uid: "leader4", displayName: "Pooja Verma", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=pooja", points: 410, badges: ["First Report", "Upvote King"], issuesReported: 3, issuesResolved: 2 },
  { uid: "leader5", displayName: "Manish Sinha", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=manish", points: 350, badges: ["First Report", "Upvote King"], issuesReported: 4, issuesResolved: 1 },
  { uid: "leader6", displayName: "Roshan Minz", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=roshan", points: 290, badges: ["First Report"], issuesReported: 2, issuesResolved: 1 },
  { uid: "leader7", displayName: "Sweta Pandey", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=sweta", points: 180, badges: ["First Report"], issuesReported: 1, issuesResolved: 0 },
  { uid: "leader8", displayName: "Amit Kumar Mahto", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=amit", points: 120, badges: [], issuesReported: 1, issuesResolved: 0 },
  { uid: "leader9", displayName: "Neha Kerketta", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=neha", points: 80, badges: [], issuesReported: 0, issuesResolved: 0 },
  { uid: "leader10", displayName: "Alok Munda", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=alok", points: 50, badges: [], issuesReported: 0, issuesResolved: 0 }
];

export const SEED_ACTIVITIES = [
  { text: "Pothole on Main Road near Albert Ekka Chowk", route: "Reported Jun 20 → Resolved Jun 23", location: "Main Road (Ward 18)" },
  { text: "Water Sluice Leak near Burdwan Compound", route: "Reported Jun 21 → Resolved Jun 22", location: "Lalpur (Ward 14)" },
  { text: "High-Mast Streetlight Repair at Daily Market", route: "Reported Jun 18 → Resolved Jun 20", location: "Daily Market (Ward 22)" },
  { text: "River Bank Debris Clearance", route: "Reported Jun 15 → Resolved Jun 18", location: "Subarnarekha Bank (Namkum link)" },
  { text: "Overhead Feeder Wire Secured", route: "Reported Jun 22 → Resolved Jun 23", location: "Doranda Overbridge Axis" }
];

/**
 * Checks Firestore issues count or forcefully updates seed records to Ranchi data.
 */
export async function seedFirestoreIfEmpty() {
  return forceSyncRanchiIssuesToFirestore(false);
}

/**
 * Forcefully purges outdated or non-Ranchi seed issues and seeds all 20 authentic Ranchi issues.
 */
export async function forceSyncRanchiIssuesToFirestore(force = true) {
  try {
    const issuesRef = collection(db, 'issues');
    const snapshot = await getDocs(issuesRef);

    const nonRanchiRegex = /kolkata|kmc|cesc|bbmp|bangalore|bengaluru|salt lake|park street|koramangala|indiranagar|whitefield|mg road bangalore/i;

    // Delete any obsolete non-Ranchi docs
    const deleteBatch = writeBatch(db);
    let deleteCount = 0;
    
    snapshot.docs.forEach((d) => {
      const data = d.data();
      const addr = (data.address || "") + " " + (data.title || "") + " " + (data.description || "");
      if (nonRanchiRegex.test(addr)) {
        deleteBatch.delete(d.ref);
        deleteCount++;
      }
    });

    if (deleteCount > 0) {
      await deleteBatch.commit();
      console.log(`[Seeder] Cleaned up ${deleteCount} outdated non-Ranchi documents.`);
    }

    if (!force && snapshot.docs.length >= 10 && deleteCount === 0) {
      console.log("[Seeder] Firestore already populated with valid Ranchi issues.");
      return { success: true, count: snapshot.docs.length };
    }

    console.log("[Seeder] Seeding/Updating all 20 Ranchi issues in Firestore...");
    const batch = writeBatch(db);

    RANCHI_ISSUES.forEach((issue: any, index) => {
      const issueId = `seed_issue_${index + 1}`;
      const issueDocRef = doc(db, 'issues', issueId);
      
      const issueData = {
        ...issue,
        id: issueId,
        imageUrl: issue.imageUrl || "",
        resolvedImageUrl: issue.resolvedImageUrl || null,
        reportedBy: issue.reportedBy || `citizen_rmc_${index + 1}`,
        reporterName: issue.reporterName || `RMC Warden ${index + 1}`,
        assignedDepartment: issue.category === 'pothole' ? 'Road Construction Department (RCD)' 
          : issue.category === 'streetlight' ? 'RMC Electrical & Streetlighting Cell'
          : issue.category === 'water' ? 'Drinking Water & Sanitation Department (DWSD)'
          : issue.category === 'waste' ? 'RMC Solid Waste Management Cell'
          : 'Jharkhand Bijli Vitran Nigam Limited (JBVNL)',
        createdAt: issue.createdAt || daysAgo(Math.max(1, 10 - index)),
        updatedAt: issue.updatedAt || daysAgo(Math.max(1, 5 - Math.floor(index / 2))),
        resolvedAt: issue.resolvedAt || null,
        escalatedAt: issue.escalatedAt || null,
        verificationReason: issue.verificationReason || (issue.verified ? "Validated by RMC field inspection & AI image confidence match." : "")
      };
      
      batch.set(issueDocRef, issueData, { merge: true });
    });

    // Batch seed leaderboard users
    SEED_USERS.forEach((user) => {
      const userDocRef = doc(db, 'users', user.uid);
      batch.set(userDocRef, {
        ...user,
        joinedAt: daysAgo(30)
      }, { merge: true });
    });

    // Batch seed custom recent resolutions in activities
    SEED_ACTIVITIES.forEach((activity, index) => {
      const activityDocRef = doc(db, 'activities', `seed_activity_${index + 1}`);
      batch.set(activityDocRef, {
        ...activity,
        createdAt: daysAgo(index)
      }, { merge: true });
    });

    await batch.commit();
    console.log("[Seeder] Successfully synchronized 20 Ranchi issues to Firestore!");
    return { success: true, count: RANCHI_ISSUES.length };
  } catch (error) {
    console.error("[Seeder] Seeding error:", error);
    return { success: false, error };
  }
}

export const RANCHI_DEVELOPMENT_SUGGESTIONS = [
  {
    id: "sug_rnc_1",
    type: "DEVELOPMENT_NEED",
    title: "Dedicated Pedestrian Footpath & Barrier Walkway near Albert Ekka Chowk",
    description: "Pedestrian sidewalks on Main Road are severely eroded and encroached. Need continuous paved walkway with safety bollards and tactile paving for visually impaired citizens.",
    description_original: "अल्बर्ट एक्का चौक के पास फुटपाथ पूरी तरह टूटा हुआ है, पैदल चलने वालों के लिए सुरक्षित फुटपाथ बनाया जाए।",
    description_english: "Pedestrian sidewalks on Main Road near Albert Ekka Chowk are broken and encroached. Requesting a continuous paved walkway with safety bollards and tactile paving.",
    category: "Roads",
    subCategory: "Pedestrian Infrastructure",
    infrastructureType: "Sidewalk & Pedestrian Corridor",
    intent: "REQUEST_NEW_INFRASTRUCTURE",
    urgency: "high" as const,
    priority: 4,
    status: "suggested" as const,
    address: "Mahatma Gandhi Main Rd, near Albert Ekka Chowk, Ranchi, Jharkhand 834001",
    ward: "Ward 17 - Central Commercial Corridor",
    lat: 23.3698,
    lng: 85.3252,
    upvotes: ["user1", "user2", "user4", "user5", "user7", "user9", "user12"],
    reportedBy: "citizen_rmc_101",
    reporterName: "Pooja Verma",
    userId: "user_rmc_101",
    department: "Road Construction Department (RCD)",
    assignedDepartment: "Road Construction Department (RCD)",
    source: "web" as const,
    language: "Hindi",
    confidence: 0.96,
    imageUrl: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?q=80&w=800&auto=format&fit=crop",
    adminNotes: "Triage verified. Forwarded to RCD zonal engineer for pedestrian right-of-way assessment.",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3)
  },
  {
    id: "sug_rnc_2",
    type: "DEVELOPMENT_NEED",
    title: "24/7 Primary Health Sub-Center (PHC) Upgrade at Morabadi",
    description: "Current sub-center lacks nighttime emergency triage and pediatric staff. Upgrading to a 24/7 Primary Health Center will serve over 25,000 residents in Morabadi and Bariyatu fringe.",
    description_original: "मोराबादी में प्राथमिक स्वास्थ्य केंद्र को 24 घंटे चालू करने और आपातकालीन दवाएं उपलब्ध कराने की सख्त जरूरत है।",
    description_english: "Morabadi community clinic lacks 24/7 emergency care. Requesting conversion to a full-time Primary Health Center with dedicated maternal and pediatric care.",
    category: "Healthcare",
    subCategory: "Primary Health Center",
    infrastructureType: "Municipal Health Facility",
    intent: "UPGRADE_EXISTING_INFRASTRUCTURE",
    urgency: "critical" as const,
    priority: 5,
    status: "under_review" as const,
    address: "Near Morabadi Ground, Morabadi, Ranchi, Jharkhand 834008",
    ward: "Ward 4 - Morabadi",
    lat: 23.3934,
    lng: 85.3289,
    upvotes: ["user2", "user3", "user5", "user6", "user8", "user10", "user11", "user15", "user18"],
    reportedBy: "citizen_rmc_102",
    reporterName: "Dr. Alok Murmu",
    userId: "user_rmc_102",
    department: "Health & Family Welfare Department, Jharkhand",
    assignedDepartment: "Health & Family Welfare Department, Jharkhand",
    source: "voice" as const,
    language: "Hindi",
    confidence: 0.94,
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop",
    adminNotes: "Under administrative review for National Health Mission (NHM) state co-funding grant.",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(2)
  },
  {
    id: "sug_rnc_3",
    type: "DEVELOPMENT_NEED",
    title: "Solar Powered Smart E-Bus Shelters at Birsa Munda Bus Terminal",
    description: "Install modern passenger shelters with dynamic live schedule LED boards, solar rooftop charging kiosks, and CCTV security at Khadgarha terminal.",
    description_original: "खादगढ़ा बस स्टैंड के पास आधुनिक बस स्टॉप और सोलर लाइट की व्यवस्था की जाए।",
    description_english: "Birsa Munda Khadgarha Bus Stand needs modern covered shelters with solar lighting, arrival displays, and safe waiting benches.",
    category: "Public Transport",
    subCategory: "Smart Bus Stop & EV Kiosk",
    infrastructureType: "Public Transit Hub",
    intent: "REQUEST_NEW_INFRASTRUCTURE",
    urgency: "medium" as const,
    priority: 3,
    status: "in_planning" as const,
    address: "Birsa Munda Bus Terminal, Khadgarha, Kantatoli, Ranchi, Jharkhand 834001",
    ward: "Ward 12 - Khadgarha & Kantatoli",
    lat: 23.3670,
    lng: 85.3478,
    upvotes: ["user1", "user3", "user7", "user8", "user12", "user13", "user14"],
    reportedBy: "citizen_rmc_103",
    reporterName: "Sunita Linda",
    userId: "user_rmc_103",
    department: "RMC Urban Mobility & Transport Cell",
    assignedDepartment: "RMC Urban Mobility & Transport Cell",
    source: "web" as const,
    language: "English",
    confidence: 0.92,
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop",
    adminNotes: "Incorporated into Ranchi Smart City Phase II transit feeder grid project.",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(4)
  },
  {
    id: "sug_rnc_4",
    type: "DEVELOPMENT_NEED",
    title: "Modern STEM Science Lab & Library at Doranda Girls High School",
    description: "Construct a digital science laboratory with 25 computer terminals, internet connectivity, and a community reading library for female students.",
    description_original: "डोरंडा गर्ल्स स्कूल में आधुनिक कंप्यूटर लैब और पुस्तकालय की सख्त जरूरत है।",
    description_english: "Doranda Girls High School requires a dedicated STEM laboratory and student library to enhance practical science education.",
    category: "Education",
    subCategory: "STEM Lab & Library",
    infrastructureType: "Educational Infrastructure",
    intent: "UPGRADE_EXISTING_INFRASTRUCTURE",
    urgency: "medium" as const,
    priority: 3,
    status: "approved" as const,
    address: "Doranda Girls High School Campus, Doranda, Ranchi, Jharkhand 834002",
    ward: "Ward 28 - Doranda South",
    lat: 23.3420,
    lng: 85.3210,
    upvotes: ["user3", "user4", "user6", "user9", "user10", "user14", "user16", "user19"],
    reportedBy: "citizen_rmc_104",
    reporterName: "Farzana Khatoon",
    userId: "user_rmc_104",
    department: "Department of School Education & Literacy",
    assignedDepartment: "Department of School Education & Literacy",
    source: "web" as const,
    language: "Urdu/Hindi",
    confidence: 0.95,
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800&auto=format&fit=crop",
    adminNotes: "Approved under PM-SHRI school infrastructure enhancement budget.",
    createdAt: daysAgo(11),
    updatedAt: daysAgo(1)
  },
  {
    id: "sug_rnc_5",
    type: "DEVELOPMENT_NEED",
    title: "Rainwater Harvesting & Stormwater Drainage Interceptor at Harmu Basin",
    description: "Install underground percolation wells and de-silt the concrete drainage canal running parallel to Harmu Housing Colony to stop annual monsoon waterlogging.",
    description_original: "हरमू कॉलोनी में बारिश के दिनों में जलभराव रोकने के लिए जल संचयन और बड़े नाले की व्यवस्था की जाए।",
    description_english: "Harmu housing area faces persistent waterlogging. Requesting an integrated stormwater drain and aquifer recharge wells along the river basin.",
    category: "Water",
    subCategory: "Stormwater Drainage & Harvesting",
    infrastructureType: "Drainage & Hydrology",
    intent: "REQUEST_NEW_INFRASTRUCTURE",
    urgency: "high" as const,
    priority: 4,
    status: "in_planning" as const,
    address: "Harmu Housing Colony, Bypass Road, Ranchi, Jharkhand 834002",
    ward: "Ward 26 - Harmu Housing Colony",
    lat: 23.3590,
    lng: 85.3050,
    upvotes: ["user1", "user5", "user7", "user11", "user12", "user13", "user17", "user20"],
    reportedBy: "citizen_rmc_105",
    reporterName: "Rajeshwar Tiwari",
    userId: "user_rmc_105",
    department: "Drinking Water & Sanitation Department (DWSD)",
    assignedDepartment: "Drinking Water & Sanitation Department (DWSD)",
    source: "ivr" as const,
    language: "Hindi",
    confidence: 0.91,
    imageUrl: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=800&auto=format&fit=crop",
    adminNotes: "Hydrological soil survey scheduled with DWSD technical engineers.",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(3)
  },
  {
    id: "sug_rnc_6",
    type: "DEVELOPMENT_NEED",
    title: "Public Eco-Park & Children's Sensory Playground at Bariatu Ridge",
    description: "Convert vacant municipal terrain into a community green park featuring native Sal tree canopy, jogging track, solar night garden, and safe play equipment.",
    description_original: "बरियातू में खाली पड़ी नगर निगम की जमीन पर बच्चों का पार्क और हरियाली वाला बगीचा बनाया जाए।",
    description_english: "Requesting development of an urban eco-park and children's recreation park on vacant municipal land in Bariatu.",
    category: "Parks",
    subCategory: "Urban Park & Playground",
    infrastructureType: "Recreational & Green Space",
    intent: "REQUEST_NEW_INFRASTRUCTURE",
    urgency: "low" as const,
    priority: 2,
    status: "suggested" as const,
    address: "Opposite RIMS Campus, Bariatu Road, Ranchi, Jharkhand 834009",
    ward: "Ward 8 - Bariatu",
    lat: 23.3980,
    lng: 85.3520,
    upvotes: ["user2", "user6", "user8", "user15"],
    reportedBy: "citizen_rmc_106",
    reporterName: "Kavita Tirkey",
    userId: "user_rmc_106",
    department: "RMC Parks & Beautification Wing",
    assignedDepartment: "RMC Parks & Beautification Wing",
    source: "web" as const,
    language: "Hindi",
    confidence: 0.93,
    imageUrl: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=800&auto=format&fit=crop",
    adminNotes: "Land ownership demarcation pending with revenue inspector.",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(7)
  },
  {
    id: "sug_rnc_7",
    type: "DEVELOPMENT_NEED",
    title: "Solid Waste Segregation Kiosk & Bio-Methanation Plant at Daily Market",
    description: "Install an automated mechanical compost station and wet-waste digester to process daily organic vegetable waste on-site, producing green gas for market vendors.",
    description_original: "डेली मार्केट के कचरे के निपटारे के लिए बायो-गैस और खाद बनाने का प्लांट लगाया जाए।",
    description_english: "Daily Market produces massive organic refuse. Requesting a localized bio-gas and wet waste composting kiosk.",
    category: "Sanitation",
    subCategory: "Waste-to-Energy Processing",
    infrastructureType: "Circular Sanitation Facility",
    intent: "REQUEST_NEW_INFRASTRUCTURE",
    urgency: "high" as const,
    priority: 4,
    status: "under_review" as const,
    address: "Daily Market Commercial Enclosure, Main Road, Ranchi, Jharkhand 834001",
    ward: "Ward 21 - Daily Market",
    lat: 23.3615,
    lng: 85.3228,
    upvotes: ["user3", "user5", "user7", "user9", "user11", "user16", "user18"],
    reportedBy: "citizen_rmc_107",
    reporterName: "Md. Imran Ansari",
    userId: "user_rmc_107",
    department: "RMC Solid Waste Management Cell",
    assignedDepartment: "RMC Solid Waste Management Cell",
    source: "web" as const,
    language: "Hindi",
    confidence: 0.97,
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800&auto=format&fit=crop",
    adminNotes: "Techno-commercial feasibility study submitted to Swachh Bharat Mission (Urban) directorate.",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1)
  },
  {
    id: "sug_rnc_8",
    type: "DEVELOPMENT_NEED",
    title: "Rooftop Solar Micro-Grid & High-Efficiency LED Illumination for Hatia Station Road",
    description: "Deploy a distributed solar micro-grid with lithium storage along Hatia railway station access corridor, guaranteeing zero-blackout lighting for round-the-clock rail travelers.",
    description_original: "हटिया स्टेशन रोड पर 24 घंटे सोलर स्ट्रीट लाइट और सुरक्षित प्रकाश की व्यवस्था हो चुकी है।",
    description_english: "Solar micro-grid and LED illumination installed along Hatia station corridor for nocturnal commuters.",
    category: "Electricity",
    subCategory: "Clean Energy Micro-Grid",
    infrastructureType: "Renewable Energy Grid",
    intent: "UPGRADE_EXISTING_INFRASTRUCTURE",
    urgency: "medium" as const,
    priority: 3,
    status: "completed" as const,
    address: "Hatia Railway Station Link Road, Hatia, Ranchi, Jharkhand 834003",
    ward: "Ward 39 - Hatia Industrial",
    lat: 23.3280,
    lng: 85.3110,
    upvotes: ["user1", "user4", "user8", "user10", "user13", "user14", "user19", "user21"],
    reportedBy: "citizen_rmc_108",
    reporterName: "Vikram Sengupta",
    userId: "user_rmc_108",
    department: "Jharkhand Renewable Energy Development Agency (JREDA)",
    assignedDepartment: "Jharkhand Renewable Energy Development Agency (JREDA)",
    source: "web" as const,
    language: "English",
    confidence: 0.98,
    imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=800&auto=format&fit=crop",
    adminNotes: "Project commissioned and inspected by JREDA. 48 solar street poles energized.",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2)
  }
];

export async function forceSyncSuggestionsToFirestore(force: boolean = false) {
  try {
    const snapshot = await getDocs(collection(db, 'suggestions'));
    if (!force && snapshot.docs.length >= 5) {
      console.log("[Seeder] Firestore already populated with suggestions.");
      return { success: true, count: snapshot.docs.length };
    }

    console.log("[Seeder] Synchronizing development suggestions to Firestore...");
    const batch = writeBatch(db);

    RANCHI_DEVELOPMENT_SUGGESTIONS.forEach((sug) => {
      const docRef = doc(db, 'suggestions', sug.id);
      batch.set(docRef, {
        ...sug,
        createdAt: sug.createdAt || serverTimestamp(),
        updatedAt: sug.updatedAt || serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    console.log(`[Seeder] Synchronized ${RANCHI_DEVELOPMENT_SUGGESTIONS.length} suggestions to Firestore!`);
    return { success: true, count: RANCHI_DEVELOPMENT_SUGGESTIONS.length };
  } catch (error) {
    console.error("[Seeder] Suggestions seeding error:", error);
    return { success: false, error };
  }
}

