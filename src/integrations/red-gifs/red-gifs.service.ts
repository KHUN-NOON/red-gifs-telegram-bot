import { inject, injectable } from "tsyringe";
import { ApiAuthService } from "./red-gifs-api-auth.service.ts";
import logger from "../../configs/logger.ts";
import type { VideoItem } from "./red-gifs.types.ts";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { TOKENS } from "../../configs/di/tokens.ts";
import { sleep } from "../../shared/utils.ts";

const authService = ApiAuthService.getInstance();

@injectable()
export class RedGifsService {
  constructor(
    @inject(TOKENS.Prisma)
    private prisma: PrismaClient,
  ) {}

  async fetchLatestVideos(retryCount = 0): Promise<VideoItem[]> {
    const token = await authService.getValidToken();
    const url = process.env.RED_GIFS_API;
    const response = await fetch(
      `${url}/feeds/trending/popular?page=1&count=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Handle sudden server-side revocation or expired token
    if (response.status === 401 && retryCount === 0) {
      logger.warn(
        "[Auth] Received 401 Unauthorized. Invalidating token and retrying...",
      );
      authService.invalidateToken();
      return this.fetchLatestVideos(retryCount + 1);
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch videos. HTTP Status: ${response.status}`,
      );
    }

    const jsonResponse = await response.json();

    return jsonResponse.gifs;
  }

  async processLatestVideosJob() {
    console.log("[Cron] Checking for latest videos...");

    try {
      // 1. Fetch latest 10 videos with JWT handling
      const latestVideos = await this.fetchLatestVideos();

      if (!latestVideos.length) {
        console.log("[Cron] No videos returned by API.");
        return;
      }

      // 2. Fetch existing video IDs from DB
      const incomingIds = latestVideos.map((v) => v.id);
      const existingRecords = await this.prisma.publishedVideo.findMany({
        where: { gifId: { in: incomingIds } },
        select: { gifId: true },
      });

      const existingIdSet = new Set(existingRecords.map((r) => r.gifId));

      // 3. Filter only new videos (process oldest to newest)
      const newVideos = latestVideos
        .filter((v) => !existingIdSet.has(v.id))
        .reverse();

      if (newVideos.length === 0) {
        console.log("[Cron] No new videos found.");
        return;
      }

      console.log(`[Cron] Found ${newVideos.length} new videos to dispatch.`);

      // 4. Sequential dispatch to Telegram with rate-limit pacing
      for (const video of newVideos) {
        const sent = await this.sendVideoToTelegram(video);

        if (sent) {
          await this.prisma.publishedVideo.create({
            data: {
              gifId: video.id,
              description: video.description,
              hdUrl: video.urls.hd,
              sdUrl: video.urls.sd,
            },
          });
          console.log(`[Cron] Successfully processed video ID: ${video.id}`);
        }

        await sleep(2000);
      }
    } catch (error) {
      console.error("[Cron Job Error]:", error);
    }
  }

  async sendVideoToTelegram(video: VideoItem) {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

    const tags = video.tags.map((item) => `#${item}`).join(" ");

    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          video: video.urls.hd,
          caption: `<b>${video.description}\n</b> <b>@${video.userName}</b> ${tags}`,
          parse_mode: "HTML",
          supports_streaming: true,
          protect_content: true,
        }),
      },
    );

    const data = await res.json();
    return data.ok;
  }
}
