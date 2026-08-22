import "dotenv/config";

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV ?? "development",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
};
