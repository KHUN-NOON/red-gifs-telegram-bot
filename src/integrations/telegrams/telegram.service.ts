import { injectable } from "tsyringe";
import type { Logger } from "winston";
import { AppError } from "../../shared/error.ts";
import { env } from "../../configs/env.ts";

@injectable()
export class TelegramService {
  constructor() {}

  async sendMessage(chatId: number, message: string): Promise<any> {
    if (!message) {
      throw new AppError("Message content cannot be empty", 400);
    }

    return await this.callTelegramApi("sendMessage", {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML", // Optional: allows <b>bold</b>, <i>italic</i>, etc.
    });
  }

  async callTelegramApi<T = Record<string, any>>(
    method: string,
    payload: T,
  ): Promise<any> {
    try {
      const token = env.telegramBotToken;

      if (!token) {
        throw new AppError("Telegram bot token is not configured", 500);
      }

      const response = await fetch(
        `https://api.telegram.org/bot${token}/${method}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const errorMessage = data.description || (await response.text());
        throw new AppError(
          `Telegram API error (${method}): ${errorMessage}`,
          response.status || 500,
        );
      }

      return data.result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Failed to call Telegram API (${method}): ${(error as Error).message}`,
        500,
      );
    }
  }
}
