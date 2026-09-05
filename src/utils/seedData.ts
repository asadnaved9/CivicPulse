import { collection, getDocs, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper to calculate relative timestamp
function daysAgo(num: number) {
  const date = new Date();
  date.setDate(date.getDate() - num);
  return date;
}

export const BANGALORE_ISSUES = [
  // Koramangala (8 issues)
  {
    title: "Severe Road Potholes on 80 Feet Road",
    description: "Huge series of deep potholes right in the middle of the active traffic lane near Sony Signal. Vehicles are constantly swerving to avoid them, creating extreme accident risks for two-wheelers.",
    category: "pothole",
    severity: 5,
    severityReason: "Located on a high-speed arterial road, presenting direct risk of vehicle damage and severe rider injury.",
    status: "verified",
    lat: 12.9362,
    lng: 77.6255,
    address: "80 Feet Rd, Koramangala 4th Block, Bengaluru, Karnataka 560034",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_severe_dangerous_road_potholes_on_80_feet_road_bangalore_deep_holes_active_traffic_lane_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_smoothly_repaired_and_newly_asphalted_road_on_80_feet_road_bangalore_with_no_potholes_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user2", "user3", "user4"],
    verified: true,
    verificationReason: "AI image match confirms severe physical distress in public transit sector. Verified by 4 independent citizen logs.",
    aiTags: ["road-damage", "pothole", "accident-risk", "traffic-disruption"],
    estimatedResolutionDays: 4,
    escalated: false,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2)
  },
  {
    title: "Broken Streetlight Near Maharaja Restaurant",
    description: "The street light has been completely non-functional for over a week. The entire corner is pitch black at night, making it unsafe for female pedestrians walking home from the nearby bus stop.",
    category: "streetlight",
    severity: 3,
    severityReason: "Pedestrian safety concern in a commercial area, elevated risk of localized petty crime or tripping.",
    status: "in_progress",
    lat: 12.9312,
    lng: 77.6212,
    address: "Maharaja Restaurant Crossing, Koramangala 5th Block, Bengaluru 560095",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_dark_commercial_street_at_night_near_maharaja_restaurant_bangalore_with_a_broken_dead_streetlight_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_brightly_lit_street_at_night_near_maharaja_restaurant_bangalore_with_a_working_led_streetlight_casting_vibrant_white_light_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user3", "user5", "user7", "user8", "user9"],
    verified: true,
    verificationReason: "Night vision confirmation indicates total lamp ballast burnout. Escalated to BESCOM division.",
    aiTags: ["streetlight", "darkness", "safety-hazard"],
    estimatedResolutionDays: 3,
    escalated: false,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3)
  },
  {
    title: "Overflowing Commercial Trash Compactor",
    description: "Heavy accumulation of solid food waste from nearby eateries dumped on the side pavement. The stench is overwhelming and stray dogs are tearing garbage bags apart, scattering litter.",
    category: "waste",
    severity: 4,
    severityReason: "Public health hazard. Attracts disease vectors and blocks pedestrian sidewalk.",
    status: "reported",
    lat: 12.9385,
    lng: 77.6298,
    address: "1st Cross Rd, Koramangala 6th Block, Bengaluru, Karnataka 560095",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_an_overflowing_commercial_garbage_dumpster_on_the_pavement_with_scattered_solid_food_waste_and_litter_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_clean_swept_and_empty_concrete_pavement_with_no_trash_or_dumpster_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user4"],
    verified: false,
    verificationReason: "",
    aiTags: ["garbage-dump", "public-health", "odor-nuisance"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },
  {
    title: "Broken Water Pipe Gushing Clean Water",
    description: "A major water main burst early this morning. Thousands of liters of drinking water are being wasted and flooding the adjoining low-lying residential garages.",
    category: "water",
    severity: 5,
    severityReason: "Critical resource waste and active residential flooding. High priority intervention.",
    status: "resolved",
    lat: 12.9332,
    lng: 77.6278,
    address: "Residential Lane 12, Koramangala 3rd Block, Bengaluru, Karnataka 560034",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_broken_water_main_pipe_bursting_with_a_huge_high_pressure_water_geyser_flooding_residential_garages_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_repaired_water_main_pipe_under_ground_dry_and_clean_residential_road_with_no_flooding_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user2", "user4", "user5", "user6"],
    verified: true,
    verificationReason: "Hydro-leak confirmed from residential mains. Dispatching BWSSB crew.",
    aiTags: ["water-leak", "flooding", "resource-waste"],
    estimatedResolutionDays: 1,
    escalated: false,
    createdAt: daysAgo(4),
    resolvedAt: daysAgo(2),
    updatedAt: daysAgo(2)
  },
  {
    title: "Exposed High-Voltage Overhead Cables",
    description: "During tree pruning, some overhead power cables snapped and are now hanging dangerously low, just 6 feet above the footpath. This is extremely lethal on rainy days.",
    category: "other",
    severity: 5,
    severityReason: "High probability of electrocution for pedestrians. Critical life-safety concern.",
    status: "reported",
    lat: 12.9352,
    lng: 77.6245,
    address: "12th Main Rd, Koramangala 4th Block, Bengaluru, Karnataka 560034",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_dangerous_exposed_high_voltage_electrical_power_cables_hanging_dangerously_low_above_a_wet_footpath_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_safely_bundled_and_securely_elevated_utility_power_lines_high_up_on_a_utility_pole_above_a_safe_pedestrian_sidewalk_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user3", "user4", "user6", "user7", "user8", "user10"],
    verified: false,
    verificationReason: "",
    aiTags: ["exposed-wire", "power-hazard", "lethal"],
    estimatedResolutionDays: 1,
    escalated: true,
    escalatedAt: daysAgo(2),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2)
  },
  {
    title: "Fallen Tree Blocking Two Lanes",
    description: "A huge gulmohar tree fell during the heavy storm last night, completely blocking the secondary residential access lane.",
    category: "other",
    severity: 4,
    severityReason: "Complete blockage of neighborhood transit, emergency vehicles cannot pass.",
    status: "resolved",
    lat: 12.9392,
    lng: 77.6201,
    address: "7th Main Road, Koramangala 1st Block, Bengaluru, Karnataka 560034",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_huge_fallen_tree_completely_blocking_two_lanes_of_a_residential_street_after_a_heavy_storm_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_clear_residential_street_with_no_branches_the_fallen_tree_completely_removed_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user5", "user9"],
    verified: true,
    verificationReason: "Severe storm damage block. BBMP forest team cleared obstruction.",
    aiTags: ["storm-damage", "roadblock", "fallen-tree"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(6),
    resolvedAt: daysAgo(5),
    updatedAt: daysAgo(5)
  },
  {
    title: "Clogged Stormwater Drain causing Backflow",
    description: "Plastic bottles and commercial wrappers have completely choked the roadside drain entrance, causing black water to pool on the street.",
    category: "water",
    severity: 4,
    severityReason: "Risk of vector-borne diseases and stagnant blackwater backflow onto footpaths.",
    status: "verified",
    lat: 12.9344,
    lng: 77.6222,
    address: "Opposite Koramangala Club, Bengaluru 560034",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_roadside_stormwater_drain_completely_clogged_with_plastic_bottles_and_garbage_black_water_overflowing_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_clean_repaired_roadside_drainage_grate_and_clear_flowing_water_with_no_plastic_trash_or_blockage_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user5", "user7"],
    verified: true,
    verificationReason: "AI detects massive plastic blockage at drain filter. Escalated.",
    aiTags: ["drainage-block", "litter", "flooding-hazard"],
    estimatedResolutionDays: 3,
    escalated: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3)
  },
  {
    title: "Damaged Sidewalk Pavement Blocks",
    description: "The concrete pavers on the footpath have buckled and broken. Senior citizens have tripped here multiple times this week.",
    category: "other",
    severity: 2,
    severityReason: "Minor pedestrian tripping risk, but limits wheelchair or stroller accessibility.",
    status: "reported",
    lat: 12.9328,
    lng: 77.6262,
    address: "Koramangala 5th Block Footpath, Bengaluru 560095",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_broken_cracked_and_buckled_interlocking_concrete_pavers_on_a_city_pedestrian_footpath_uneven_ground_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_newly_laid_perfectly_flat_intact_interlocking_concrete_paver_blocks_on_a_clean_city_footpath_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user8"],
    verified: false,
    verificationReason: "",
    aiTags: ["footpath-damage", "pedestrian-hazard"],
    estimatedResolutionDays: 7,
    escalated: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },

  // Indiranagar (7 issues)
  {
    title: "Non-functional Streetlights on Double Road",
    description: "A series of 5 consecutive streetlights are broken on Indiranagar Double Road, leaving a major blind curve in absolute darkness.",
    category: "streetlight",
    severity: 4,
    severityReason: "Major curve on a high-density commuter road in complete darkness. High crash risk.",
    status: "reported",
    lat: 12.9754,
    lng: 77.6428,
    address: "Double Rd, Indiranagar Stage 2, Bengaluru, Karnataka 560038",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_pitch_black_highway_curve_on_double_road_at_night_with_broken_non_functional_street_lamps_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_double_road_at_night_brightly_illuminated_by_five_consecutive_glowing_white_led_streetlights_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user4", "user6", "user8", "user10", "user11"],
    verified: false,
    verificationReason: "",
    aiTags: ["streetlights", "blind-curve", "driving-hazard"],
    estimatedResolutionDays: 3,
    escalated: true,
    escalatedAt: daysAgo(1),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1)
  },
  {
    title: "Large Underground Sewer Leakage",
    description: "Smelly raw sewage is bubbling up from a manhole cover on 100 Feet Road, flowing into the commercial storefront entrances.",
    category: "water",
    severity: 5,
    severityReason: "Raw sewage exposure in major commercial district. Severe hygienic hazard and pedestrian block.",
    status: "verified",
    lat: 12.9784,
    lng: 77.6408,
    address: "100 Feet Rd, near Metro Station, Indiranagar, Bengaluru 560038",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_smelly_dark_sewage_water_bubbling_up_from_a_manhole_on_100_feet_road_flowing_onto_the_pavement_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_sealed_iron_manhole_cover_on_a_completely_dry_clean_asphalt_street_with_no_leakage_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user2", "user3"],
    verified: true,
    verificationReason: "Sewer trunk line failure confirmed. Immediate BWSSB emergency dispatch.",
    aiTags: ["sewer-leak", "public-health", "metro-area"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2)
  },
  {
    title: "Enormous Pothole near Toit Brewpub",
    description: "A wide pothole measuring nearly 4 feet across and 6 inches deep has formed. Drivers brake abruptly, causing near misses.",
    category: "pothole",
    severity: 4,
    severityReason: "Deep pothole in extremely busy nightlife sector. High risk for night-time drivers.",
    status: "in_progress",
    lat: 12.9791,
    lng: 77.6451,
    address: "298, 100 Feet Rd, Indiranagar Stage II, Bengaluru 560038",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_huge_four_foot_wide_six_inch_deep_pothole_on_busy_asphalt_road_near_toit_brewpub_indiranagar_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_freshly_repaired_filled_and_patched_flat_black_asphalt_pothole_restored_road_near_toit_brewpub_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user4", "user5", "user7", "user9"],
    verified: true,
    verificationReason: "AI verifies depth hazard. Temporary asphalt filling assigned to ward engineer.",
    aiTags: ["pothole", "accident-risk", "nightlife-sector"],
    estimatedResolutionDays: 4,
    escalated: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2)
  },
  {
    title: "Illegal E-Waste Dumping on Service Lane",
    description: "Old computer monitors, batteries, and industrial plastics dumped alongside the service lane. Toxic materials could leach into soil.",
    category: "waste",
    severity: 4,
    severityReason: "Toxic waste dumping in public residential zones. Hazardous environmental risk.",
    status: "reported",
    lat: 12.9732,
    lng: 77.6385,
    address: "6th Cross, Indiranagar Stage 1, Bengaluru, Karnataka 560038",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_piles_of_illegal_electronic_waste_old_monitors_batteries_keyboards_dumped_by_the_grassy_service_lane_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_completely_rehabilitated_clean_grassy_service_lane_with_all_e_waste_cleared_and_swept_tidy_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user3"],
    verified: false,
    verificationReason: "",
    aiTags: ["hazardous-waste", "illegal-dumping", "e-waste"],
    estimatedResolutionDays: 5,
    escalated: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },
  {
    title: "Damaged Cable Box Hanging Open",
    description: "An optical fiber junction box is hanging open with dozens of loose telecommunication wires dangling on the sidewalk.",
    category: "other",
    severity: 2,
    severityReason: "Dangling telecom lines present a nuisance but are low-voltage, meaning no immediate electrocution hazard.",
    status: "resolved",
    lat: 12.9811,
    lng: 77.6442,
    address: "12th Main Rd, Indiranagar, Bengaluru 560008",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_an_optical_fiber_junction_box_hanging_brokenly_open_on_a_brick_wall_with_loose_telecom_wires_dangling_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_repaired_securely_locked_new_metal_cable_box_mounted_on_the_wall_with_tidy_secured_wiring_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user5"],
    verified: true,
    verificationReason: "Telecom hardware distress. Fixed and closed by ACT Fiber team.",
    aiTags: ["wires", "utility-box", "footpath-obstacle"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(5),
    resolvedAt: daysAgo(3),
    updatedAt: daysAgo(3)
  },
  {
    title: "Broken Fire Hydrant Gushing Water",
    description: "A commercial truck backed into the fire hydrant, cracking the valve. Clean water is spraying onto the street.",
    category: "water",
    severity: 4,
    severityReason: "High-pressure clean water loss. Disruption of emergency response capability.",
    status: "resolved",
    lat: 12.9772,
    lng: 77.6468,
    address: "Defence Colony Road, Indiranagar, Bengaluru 560038",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_broken_yellow_fire_hydrant_gushing_a_high_pressure_spray_of_clean_water_all_over_the_roadway_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_capped_and_sealed_repaired_yellow_fire_hydrant_with_completely_dry_ground_and_no_spraying_water_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user4", "user6", "user10"],
    verified: true,
    verificationReason: "High pressure hydrant leak. Successfully capped by city water division.",
    aiTags: ["water-waste", "flooding", "hydrant-damage"],
    estimatedResolutionDays: 1,
    escalated: false,
    createdAt: daysAgo(7),
    resolvedAt: daysAgo(6),
    updatedAt: daysAgo(6)
  },
  {
    title: "Garbage Pile Burning in Residential Block",
    description: "Sweepings and plastic garbage are being burned in the open by sweepers, filling the entire apartment block with toxic acrid smoke.",
    category: "waste",
    severity: 4,
    severityReason: "Active combustion of toxic plastics. Severe air pollution and immediate fire hazard.",
    status: "verified",
    lat: 12.9721,
    lng: 77.6441,
    address: "Indiranagar Stage 2, Residential Park lane, Bengaluru 560038",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_sweepings_and_plastic_garbage_burning_in_the_open_in_front_of_apartment_buildings_with_thick_toxic_smoke_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_vacant_clean_open_plot_where_garbage_burning_stopped_neatly_swept_and_fenced_with_fresh_grass_planted_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user3", "user5"],
    verified: true,
    verificationReason: "Toxic waste burning confirmed. Directed marshal to fine perpetrators.",
    aiTags: ["toxic-smoke", "fire-hazard", "illegal-burning"],
    estimatedResolutionDays: 1,
    escalated: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3)
  },

  // Whitefield (5 issues)
  {
    title: "Extreme Water Logged Road under Railway Bridge",
    description: "Every rain, the road under the Whitefield railway bridge floods with 3 feet of water, trapping cars and causing hours of traffic.",
    category: "water",
    severity: 5,
    severityReason: "Complete blockage of a vital railway underpass, causing massive vehicular entrapment.",
    status: "reported",
    lat: 12.9698,
    lng: 77.7499,
    address: "Railway Underpass Rd, Whitefield, Bengaluru, Karnataka 560066",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_road_under_railway_bridge_severely_flooded_with_three_feet_of_dirty_water_submerged_car_tires_traffic_jam_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_completely_dry_fully_drained_smooth_roadway_under_railway_bridge_with_new_side_stormwater_gutters_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user2", "user3", "user4", "user5", "user6", "user7", "user8"],
    verified: false,
    verificationReason: "",
    aiTags: ["flooding", "underpass-blockage", "extreme-traffic"],
    estimatedResolutionDays: 5,
    escalated: true,
    escalatedAt: daysAgo(3),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(3)
  },
  {
    title: "Deep Pavement Crater on ITPL Main Road",
    description: "A giant crater has opened up on the left side of the ITPL road just after the main campus gate, heavily disrupting tech park bus flow.",
    category: "pothole",
    severity: 4,
    severityReason: "Major commuter transit route heavily disrupted. Dangerous for high volume of employee buses and scooters.",
    status: "reported",
    lat: 12.9842,
    lng: 77.7401,
    address: "ITPL Main Rd, near Pattandur Agrahara, Whitefield, Bengaluru 560066",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_giant_deep_crater_pothole_on_the_asphalt_of_itpl_main_road_disrupting_heavy_traffic_daytime_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_perfectly_re_paved_smooth_asphalt_roadway_on_itpl_main_road_where_the_giant_crater_was_filled_and_patched_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user2", "user5"],
    verified: false,
    verificationReason: "",
    aiTags: ["crater", "commuter-route", "itpl-road"],
    estimatedResolutionDays: 4,
    escalated: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },
  {
    title: "Broken Streetlight Mast on Outer Ring Road",
    description: "The entire metallic street light pole has rusted and is listing heavily over the highway, threatening to fall.",
    category: "streetlight",
    severity: 4,
    severityReason: "Structural failure of a heavy highway lightpole. High risk of immediate crushing hazard.",
    status: "in_progress",
    lat: 12.9642,
    lng: 77.7532,
    address: "Outer Ring Rd highway connection, Whitefield ward, Bengaluru 560066",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_a_rusted_metal_street_light_pole_bent_and_leaning_dangerously_low_over_outer_ring_road_highway_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_sturdy_brand_new_straight_galvanized_steel_highway_streetlight_pole_with_modern_led_light fixture_on_outer_ring_road_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user3", "user6", "user8"],
    verified: true,
    verificationReason: "AI identifies heavy listing structural hazard. Maintenance team dispatched for support extraction.",
    aiTags: ["listed-pole", "highway-hazard", "structural-failure"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2)
  },
  {
    title: "Massive Dump of Construction Demolition Debris",
    description: "Commercial building contractors have illegally dumped multiple truckloads of concrete and brick debris directly onto the public lake walking path.",
    category: "waste",
    severity: 3,
    severityReason: "Footpath obstruction and environmental encroachment of the public lake zone.",
    status: "resolved",
    lat: 12.9681,
    lng: 77.7432,
    address: "Sheelavanthakere Lake Footpath, Whitefield, Bengaluru 560066",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_multiple_truckloads_of_broken_concrete_bricks_debris_illegally_dumped_on_lake_walking_path_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_cleared_tidy_brick_walking_trail_by_the_lake_with_all_demolition_debris_removed_scenic_lakeview_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user5", "user7"],
    verified: true,
    verificationReason: "Demolition debris encroachment. BBMP penalty levied and cleared by loader.",
    aiTags: ["debris", "lake-encroachment", "obstruction"],
    estimatedResolutionDays: 4,
    escalated: false,
    createdAt: daysAgo(10),
    resolvedAt: daysAgo(7),
    updatedAt: daysAgo(7)
  },
  {
    title: "Water Tanker Spilling Slush and Clay on Highway",
    description: "Unauthorized commercial water tankers are leaking dirty swamp water all along the ITPL road, making the asphalt extremely slippery.",
    category: "water",
    severity: 3,
    severityReason: "Slippery slush hazard on asphalt, endangering high-speed two-wheelers.",
    status: "verified",
    lat: 12.9712,
    lng: 77.7482,
    address: "ECC Road, Pattandur Agrahara, Whitefield, Bengaluru 560066",
    imageUrl: "https://image.pollinations.ai/p/photograph_of_wet_muddy_clay_and_slush_spilled_all_over_the_asphalt_on_itpl_road_slick_dangerous_mud_streaks_bangalore_realistic_photo?width=800&height=600&nologo=true",
    resolvedImageUrl: "https://image.pollinations.ai/p/photograph_of_a_perfectly_washed_clean_and_completely_dry_asphalt_highway_with_no_mud_streaks_bangalore_realistic_photo?width=800&height=600&nologo=true",
    upvotes: ["user1", "user4", "user9"],
    verified: true,
    verificationReason: "Spill hazard validated. Ward security requested to intercept water tanker fleet.",
    aiTags: ["slush-spill", "slippery", "tanker-leak"],
    estimatedResolutionDays: 2,
    escalated: false,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2)
  }
];

export const SEED_USERS = [
  { uid: "leader1", displayName: "Ramesh Kumar", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=ramesh", points: 1540, badges: ["First Report", "Civic Champion", "Community Guardian", "Truth Teller"], issuesReported: 18, issuesResolved: 12 },
  { uid: "leader2", displayName: "Anita Sen", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=anita", points: 840, badges: ["First Report", "Civic Champion", "Truth Teller"], issuesReported: 9, issuesResolved: 5 },
  { uid: "leader3", displayName: "Karthik Raja", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=karthik", points: 650, badges: ["First Report", "Civic Champion"], issuesReported: 6, issuesResolved: 4 },
  { uid: "leader4", displayName: "Priya Hegde", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=priya", points: 410, badges: ["First Report", "Upvote King"], issuesReported: 3, issuesResolved: 2 },
  { uid: "leader5", displayName: "Vikram Malhotra", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=vikram", points: 350, badges: ["First Report", "Upvote King"], issuesReported: 4, issuesResolved: 1 },
  { uid: "leader6", displayName: "John D'Souza", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=john", points: 290, badges: ["First Report"], issuesReported: 2, issuesResolved: 1 },
  { uid: "leader7", displayName: "Shreya Ghoshal", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=shreya", points: 180, badges: ["First Report"], issuesReported: 1, issuesResolved: 0 },
  { uid: "leader8", displayName: "Arjun Reddy", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=arjun", points: 120, badges: [], issuesReported: 1, issuesResolved: 0 },
  { uid: "leader9", displayName: "Sneha Patil", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=sneha", points: 80, badges: [], issuesReported: 0, issuesResolved: 0 },
  { uid: "leader10", displayName: "Dev Anand", photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=dev", points: 50, badges: [], issuesReported: 0, issuesResolved: 0 }
];

export const SEED_ACTIVITIES = [
  { text: "Pothole on MG Road", route: "Reported Jun 20 → Resolved Jun 23", location: "Koramangala 3rd Block" },
  { text: "Water Leak on 12th Main", route: "Reported Jun 21 → Resolved Jun 22", location: "Indiranagar defence" },
  { text: "Broken Streetlight in Park", route: "Reported Jun 18 → Resolved Jun 20", location: "Koramangala 1st Block" },
  { text: "Construction Debris Clear", route: "Reported Jun 15 → Resolved Jun 18", location: "Whitefield Lake Footpath" },
  { text: "Telecom Open Wire Cable Tie", route: "Reported Jun 22 → Resolved Jun 23", location: "Indiranagar Metro Station" }
];

/**
 * Checks Firestore issues count. If fewer than 5 issues, seeds 20 realistic records.
 * Also forcefully updates image URLs of already-seeded issues to ensure correct matching imagery.
 */
export async function seedFirestoreIfEmpty() {
  try {
    const issuesRef = collection(db, 'issues');
    const snapshot = await getDocs(issuesRef);

    if (snapshot.docs.length >= 5) {
      console.log("[Seeder] Firestore is already populated with issues. Ensuring seed images/data are perfectly aligned...");
      const updateBatch = writeBatch(db);
      BANGALORE_ISSUES.forEach((issue: any, index) => {
        const issueId = `seed_issue_${index + 1}`;
        const issueDocRef = doc(db, 'issues', issueId);
        updateBatch.set(issueDocRef, {
          imageUrl: issue.imageUrl || "",
          resolvedImageUrl: issue.resolvedImageUrl || null,
          title: issue.title,
          description: issue.description
        }, { merge: true });
      });
      await updateBatch.commit();
      console.log("[Seeder] Seed issues images matched and synchronized successfully!");
      return;
    }

    console.log("[Seeder] Firestore has fewer than 5 issues. Seeding Bangalore data...");

    // Batch seed issues
    const batch = writeBatch(db);
    
    BANGALORE_ISSUES.forEach((issue: any, index) => {
      const issueId = `seed_issue_${index + 1}`;
      const issueDocRef = doc(db, 'issues', issueId);
      
      const issueData = {
        ...issue,
        id: issueId,
        imageUrl: issue.imageUrl || "",
        resolvedImageUrl: issue.resolvedImageUrl || null,
        reportedBy: issue.reportedBy || "seed_reporter_bbmp",
        reporterName: issue.reporterName || "BBMP Citizen Warden",
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        resolvedAt: issue.resolvedAt || null,
        escalatedAt: issue.escalatedAt || null,
        verificationReason: issue.verificationReason || ""
      };
      
      batch.set(issueDocRef, issueData);
    });

    // Batch seed leaderboard users
    SEED_USERS.forEach((user) => {
      const userDocRef = doc(db, 'users', user.uid);
      batch.set(userDocRef, {
        ...user,
        joinedAt: daysAgo(30)
      });
    });

    // Batch seed custom recent resolutions in activities
    SEED_ACTIVITIES.forEach((activity, index) => {
      const activityDocRef = doc(db, 'activities', `seed_activity_${index + 1}`);
      batch.set(activityDocRef, {
        ...activity,
        createdAt: daysAgo(index)
      });
    });

    await batch.commit();
    console.log("[Seeder] Seeding of Bangalore issues, users, and activities completed successfully!");
  } catch (error) {
    console.error("[Seeder] Seeding error:", error);
  }
}
