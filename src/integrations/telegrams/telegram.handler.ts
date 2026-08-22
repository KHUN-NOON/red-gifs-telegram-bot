import { inject, injectable } from "tsyringe";
import type { TelegramMessage } from "./telegram.types.ts";
import { TelegramService } from "./telegram.service.ts";

@injectable()
export class TelegramHandler {
  constructor(
    @inject(TelegramService)
    private telegramService: TelegramService,
  ) {}

  public async handleMessage(message: TelegramMessage): Promise<void> {
    const text = message.text;
    const chatId = message.chat.id;

    if (!text) return;

    // Handle commands
    if (text.startsWith("/start")) {
      await this.telegramService.sendMessage(
        chatId,
        `Hello ${message.from?.first_name || "there"}! Welcome.`,
      );
    } else if (text.startsWith("/help")) {
      await this.telegramService.sendMessage(
        chatId,
        "Available commands:\n/start\n/help",
      );
    } else {
      await this.telegramService.sendMessage(chatId, `You said: "${text}"`);
    }
  }

  public async handleCallbackQuery(callbackQuery: any): Promise<void> {
    // Process button clicks/inline keyboard callbacks
    const chatId = callbackQuery.message?.chat.id;
    if (chatId) {
      await this.telegramService.sendMessage(
        chatId,
        `Button clicked: ${callbackQuery.data}`,
      );
    }
  }
}
