import { Router } from "express";
import categoryRoute from "../modules/catagories/category.route.ts";
import { container } from "tsyringe";
import { TelegramWebhook } from "../integrations/telegrams/telegram.webhook.ts";

const rootRouter = Router();

const telegramWebhook = container.resolve(TelegramWebhook);

rootRouter.use("/categories", categoryRoute);
rootRouter.post("/webhook", (req, res, next) =>
  telegramWebhook.handleWebhook(req, res, next),
);
export default rootRouter;
