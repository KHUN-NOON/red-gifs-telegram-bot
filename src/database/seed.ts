import { seedCategories } from "./seeders/category.seeder.ts";
import { prisma } from "./db.ts";

const seeders = {
  categories: seedCategories,
};

async function main() {
  const requestedSeeders = process.argv.slice(2);

  // No argument = run everything
  if (requestedSeeders.length === 0) {
    for (const seeder of Object.values(seeders)) {
      await seeder(prisma);
    }

    return;
  }

  // Run only requested seeders
  for (const name of requestedSeeders) {
    const seeder = seeders[name as keyof typeof seeders];

    if (!seeder) {
      throw new Error(`Unknown seeder: ${name}`);
    }

    await seeder(prisma);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
