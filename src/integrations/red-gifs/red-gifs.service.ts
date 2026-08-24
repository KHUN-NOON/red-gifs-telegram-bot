import { inject, injectable } from "tsyringe";
import { ApiAuthService } from "./red-gifs-api-auth.service.ts";
import logger from "../../configs/logger.ts";
import type { VideoItem } from "./red-gifs.types.ts";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { TOKENS } from "../../configs/di/tokens.ts";
import { escapeHtml, formatTags, sleep, truncate } from "../../shared/utils.ts";

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
      `${url}/feeds/trending/popular?page=1&count=10`,
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
        } else {
          console.warn(
            `[Cron] Failed to send video ID: ${video.id}. Skipping DB record.`,
          );
        }

        await sleep(3500);
      }
    } catch (error) {
      console.error("[Cron Job Error]:", error);
    }
  }

  async sendVideoToTelegram(video: VideoItem) {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

    const tags = formatTags(video.tags);
    const desc = escapeHtml(
      video.description ?? video.contentType ?? "No Description",
    );
    const user = escapeHtml(video.userName ?? "");

    const rawCaption = `<b>${desc}</b>\n<b>@${user}</b>\n\n${tags}`;
    const caption = truncate(rawCaption, 1020);

    const videoUrl = video.urls.sd;

    if (!videoUrl) {
      console.error(`[Telegram] No valid video URL for ID: ${video.id}`);
      return false;
    }
    console.log([video.id, videoUrl]);
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHANNEL_ID,
            video: videoUrl,
            caption,
            parse_mode: "HTML",
            supports_streaming: true,
            protect_content: true,
          }),
        },
      );

      const data = await res.json();

      if (!data.ok) {
        console.error(`[Telegram API Error for Video ${video.id}]:`, data);

        // Handle flood limit dynamically if triggered
        if (data.error_code === 429 && data.parameters?.retry_after) {
          const waitTime = (data.parameters.retry_after + 1) * 1000;
          console.warn(
            `[Telegram] Rate limited. Waiting ${waitTime / 1000}s...`,
          );
          await sleep(waitTime);
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[Network Error for Video ${video.id}]:`, error);
      return false;
    }
  }

  //   async sendVideoToTelegram(video: VideoItem): Promise<boolean> {
  //     const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  //     const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

  //     const tags = formatTags(video.tags);
  //     const desc = escapeHtml(
  //       video.description ?? video.contentType ?? "No Description",
  //     );
  //     const user = escapeHtml(video.userName ?? "");
  //     const caption = truncate(
  //       `<b>${desc}</b>\n<b>@${user}</b>\n\n${tags}`,
  //       1020,
  //     );

  //     const videoUrl = video.urls.hd || video.urls.sd;
  //     if (!videoUrl) {
  //       console.error(`[Telegram] No valid video URL for ID: ${video.id}`);
  //       return false;
  //     }

  //     try {
  //       // 1. Download video binary to your server
  //       const videoFetchRes = await fetch(videoUrl, {
  //         headers: {
  //           "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)",
  //           // Pass bearer auth if RedGifs requires token to access media stream:
  //           //   ...(this.cache?.token
  //           //     ? { Authorization: `Bearer ${this.cache.token}` }
  //           //     : {}),
  //         },
  //       });

  //       if (!videoFetchRes.ok) {
  //         console.error(
  //           `[CDN Error] Failed to download video binary (${video.id}): HTTP ${videoFetchRes.status}`,
  //         );
  //         return false;
  //       }

  //       const videoBuffer = await videoFetchRes.arrayBuffer();
  //       const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });
  //       // 2. Build multipart/form-data body
  //       const formData = new FormData();
  //       formData.append("chat_id", TELEGRAM_CHANNEL_ID!);
  //       formData.append("video", videoBlob, `${video.id}.mp4`);
  //       formData.append("caption", caption);
  //       formData.append("parse_mode", "HTML");
  //       formData.append("supports_streaming", "true");
  //       formData.append("protect_content", "true");

  //       console.log(`Sending video: ${video.id} to Telegram...`);
  //       // 3. Post binary stream to Telegram
  //       const res = await fetch(
  //         `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`,
  //         {
  //           method: "POST",
  //           body: formData, // native fetch sets multipart/form-data boundary automatically
  //         },
  //       );

  //       const data = await res.json();

  //       if (!data.ok) {
  //         console.error(`[Telegram API Error for Video ${video.id}]:`, data);

  //         if (data.error_code === 429 && data.parameters?.retry_after) {
  //           const waitTime = (data.parameters.retry_after + 1) * 1000;
  //           console.warn(
  //             `[Telegram] Rate limited. Waiting ${waitTime / 1000}s...`,
  //           );
  //           await sleep(waitTime);
  //         }
  //         return false;
  //       }

  //       return true;
  //     } catch (err) {
  //       console.error(`[Upload Error for Video ${video.id}]:`, err);
  //       return false;
  //     }
  //   }
}
