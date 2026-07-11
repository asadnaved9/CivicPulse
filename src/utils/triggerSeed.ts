import 'dotenv/config'; // Loads env vars before any other imports!
import { seedFirestoreIfEmpty } from './seedData';

async function run() {
  console.log("Triggering database seeding with loaded environment...");
  try {
    await seedFirestoreIfEmpty();
    console.log("Seeding triggered successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to run seed:", err);
    process.exit(1);
  }
}

run();
