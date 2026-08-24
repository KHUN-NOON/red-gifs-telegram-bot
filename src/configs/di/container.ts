import "reflect-metadata";
import { container } from "tsyringe";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { TOKENS } from "./tokens.ts";
import { prisma } from "../../database/db.ts";
import { TelegramWebhook } from "../../integrations/telegrams/telegram.webhook.ts";

container.register<PrismaClient>(TOKENS.Prisma, {
  useValue: prisma,
});

container.register(TOKENS.TelegramWebhook, {
  useValue: TelegramWebhook,
});
