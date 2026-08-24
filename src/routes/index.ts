import { Router } from "express";
import { container } from "tsyringe";
import type { AppError } from "../shared/error.ts";
import { RedGifsService } from "../integrations/red-gifs/red-gifs.service.ts";

const rootRouter = Router();

// const telegramWebhook = container.resolve(TelegramWebhook);

// rootRouter.post("/webhook", (req, res, next) =>
//   telegramWebhook.handleWebhook(req, res, next),
// );

const redGifsService = container.resolve(RedGifsService);

rootRouter.get("/api/crons/sync-videos", async (req, res) => {
  try {
    await redGifsService.processLatestVideosJob();

    return res
      .status(200)
      .json({ status: "success", timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("[Cron Error]:", error);
    return res.status(500).json({ status: "error", message: error?.message });
  }
});

export default rootRouter;
