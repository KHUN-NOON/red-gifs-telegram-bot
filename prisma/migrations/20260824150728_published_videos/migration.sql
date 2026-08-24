-- CreateTable
CREATE TABLE "published_videos" (
    "id" TEXT NOT NULL,
    "gif_id" TEXT NOT NULL,
    "sd_url" TEXT NOT NULL,
    "hd_url" TEXT NOT NULL,

    CONSTRAINT "published_videos_pkey" PRIMARY KEY ("id")
);
