import { Router } from "express";
import { container } from "tsyringe";
import { RedGifsService } from "../integrations/red-gifs/red-gifs.service.ts";

const rootRouter = Router();

rootRouter.get("/api/crons/sync-videos", async (req, res) => {
  try {
    const redGifsService = container.resolve(RedGifsService);

    await redGifsService.processLatestVideosJob();

    return res
      .status(200)
      .json({ status: "success", timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("[Cron Error]:", error);
    return res.status(500).json({ status: "error", message: error?.message });
  }
});

rootRouter.get("/api/crons/sync-niches-asian-femdom", async (req, res) => {
  try {
    const redGifsService = container.resolve(RedGifsService);

    await redGifsService.processLatestNichesAsianFemdomVideosJob();

    return res
      .status(200)
      .json({ status: "success", timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("[Cron Error]:", error);
    return res.status(500).json({ status: "error", message: error?.message });
  }
});

export default rootRouter;
