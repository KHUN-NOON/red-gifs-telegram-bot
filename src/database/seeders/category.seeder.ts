import categories from "../../../master_data/categories.json" with { type: "json" };
import type { PrismaClient } from "../../generated/prisma/client.ts";

export async function seedCategories(prisma: PrismaClient) {
  console.log("Seeding categories...");

  for (const category of categories) {
    await prisma.categories.upsert({
      where: {
        name: category.name, // Assumes 'name' is marked @unique in your schema
      },
      update: {}, // Leave empty to do nothing if the parent category already exists
      create: {
        name: category.name,
        subcategories: {
          connectOrCreate: category.subcategories.map((subcategory) => ({
            where: { name: subcategory.name }, // Checks for subcategory uniqueness
            create: { name: subcategory.name },
          })),
        },
      },
    });
  }

  console.log("Categories seeded.");
}
