import * as fs from 'fs';
import * as path from 'path';

const seedDataPath = path.join(process.cwd(), 'src', 'utils', 'seedData.ts');
const mapPagePath = path.join(process.cwd(), 'src', 'pages', 'MapPage.tsx');
const homePagePath = path.join(process.cwd(), 'src', 'pages', 'HomePage.tsx');

function migrateSeedData() {
  console.log("Migrating seedData.ts to Kolkata...");
  let content = fs.readFileSync(seedDataPath, 'utf8');

  // Replace names
  content = content.replace(/BANGALORE_ISSUES/g, 'KOLKATA_ISSUES');
  content = content.replace(/Bangalore/g, 'Kolkata');
  content = content.replace(/Bengaluru/g, 'Kolkata');
  content = content.replace(/BBMP/g, 'KMC');
  content = content.replace(/BESCOM/g, 'CESC');
  content = content.replace(/BWSSB/g, 'KMC Water Department');
  
  // Replace neighborhoods
  content = content.replace(/Koramangala/g, 'Park Street');
  content = content.replace(/Indiranagar/g, 'Salt Lake');
  content = content.replace(/Whitefield/g, 'Gariahat');

  // Regex to map coordinates:
  // Bangalore latitude range: 12.9xxx -> Kolkata: 22.5xxx (add 9.6364)
  content = content.replace(/lat:\s*(12\.\d+)/g, (match, p1) => {
    const originalLat = parseFloat(p1);
    const newLat = (originalLat - 12.9362) + 22.5726; // relative to center
    return `lat: ${parseFloat(newLat.toFixed(4))}`;
  });

  // Bangalore longitude range: 77.6xxx/77.7xxx -> Kolkata: 88.3xxx/88.4xxx (add 10.7384)
  content = content.replace(/lng:\s*(77\.\d+)/g, (match, p1) => {
    const originalLng = parseFloat(p1);
    const newLng = (originalLng - 77.6255) + 88.3639; // relative to center
    return `lng: ${parseFloat(newLng.toFixed(4))}`;
  });

  // Ensure updateBatch updates all fields during seed sync
  content = content.replace(
    /updateBatch\.set\(issueDocRef, \{\s*imageUrl:[^}]+/s,
    `updateBatch.set(issueDocRef, {
          ...issue,
          id: issueId,
          imageUrl: issue.imageUrl || "",
          resolvedImageUrl: issue.resolvedImageUrl || null,
          reportedBy: issue.reportedBy || "seed_reporter_kmc",
          reporterName: issue.reporterName || "KMC Citizen Warden",
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          resolvedAt: issue.resolvedAt || null,
          escalatedAt: issue.escalatedAt || null,
          verificationReason: issue.verificationReason || ""`
  );

  // Update seeder logs
  content = content.replace(/Seeding Bangalore data/g, 'Seeding Kolkata data');
  content = content.replace(/Seeding of Bangalore issues/g, 'Seeding of Kolkata issues');

  fs.writeFileSync(seedDataPath, content, 'utf8');
  console.log("✓ seedData.ts updated successfully!");
}

function migrateMapPage() {
  console.log("Migrating MapPage.tsx to Kolkata...");
  let content = fs.readFileSync(mapPagePath, 'utf8');

  // Change bounding box and initial center coordinates
  content = content.replace(/latMin\s*=\s*12\.\d+/g, 'latMin = 22.5000');
  content = content.replace(/latMax\s*=\s*12\.\d+/g, 'latMax = 22.6000');
  content = content.replace(/lngMin\s*=\s*77\.\d+/g, 'lngMin = 88.3000');
  content = content.replace(/lngMax\s*=\s*77\.\d+/g, 'lngMax = 88.4500');

  content = content.replace(/center:\s*\[77\.6255,\s*12\.9362\]/g, 'center: [88.3639, 22.5726]');
  content = content.replace(/Bangalore/g, 'Kolkata');
  content = content.replace(/Bengaluru/g, 'Kolkata');

  fs.writeFileSync(mapPagePath, content, 'utf8');
  console.log("✓ MapPage.tsx updated successfully!");
}

function migrateHomePage() {
  console.log("Migrating HomePage.tsx to Kolkata...");
  let content = fs.readFileSync(homePagePath, 'utf8');

  content = content.replace(/Bangalore/g, 'Kolkata');
  content = content.replace(/Bengaluru/g, 'Kolkata');

  fs.writeFileSync(homePagePath, content, 'utf8');
  console.log("✓ HomePage.tsx updated successfully!");
}

function run() {
  migrateSeedData();
  migrateMapPage();
  migrateHomePage();
  console.log("Migration complete!");
}

run();
