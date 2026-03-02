import { seedUpgrades } from './seed-upgrades';

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    console.log('📡 Seeding upgrades...');
    await seedUpgrades();

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

main();
