import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../configs/di/tokens.ts";
import type { PrismaClient } from "../../generated/prisma/client.ts";

@injectable()
export class CategoryRepository {
  constructor(
    @inject(TOKENS.Prisma)
    private prisma: PrismaClient,
  ) {}

  async find() {
    try {
      const result = await this.prisma.categories.findMany();

      return result;
    } catch (error) {
      throw error;
    }
  }
}
