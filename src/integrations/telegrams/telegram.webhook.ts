import type { NextFunction, Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import type { TelegramUpdate } from "./telegram.types.ts";
import { TelegramHandler } from "./telegram.handler.js";

@injectable()
export class TelegramWebhook {
  constructor(
    @inject(TelegramHandler)
    private handler: TelegramHandler,
  ) {}

  async handleWebhook(
    req: Request<{}, {}, TelegramUpdate>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const update = req.body;

      console.log("Telegram hitting webhook!");

      // Immediately acknowledge receipt to Telegram (Must respond 200 OK fast)
      res.status(200).send("OK");

      await this.processUpdate(update);

      console.log("Send messages to chat!");
    } catch (error) {
      next(error);
    }
  }

  private async processUpdate(update: TelegramUpdate) {
    if (update.message) {
      await this.handler.handleMessage(update.message);
    } else {
      await this.handler.handleCallbackQuery(update.callback_query);
    }
  }
}
