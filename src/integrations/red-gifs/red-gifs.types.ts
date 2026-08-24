export type AuthTokenCache = {
  token: string | null;
  expiresAt: number | null; // Unix timestamp in ms
};

export type VideoItem = {
  avgColor: string;
  canBoost: boolean;
  createDate: number;
  contentType: string;
  cta: string | null;
  description: string;
  duration: number;
  folders: unknown | null;
  gallery: unknown | null;
  hasAudio: boolean;
  height: number;
  hideHome: boolean;
  hideTrending: boolean;
  hls: boolean;
  id: string;
  likes: number;
  niches: string[];
  published: boolean;
  type: number;
  sexuality: string[];
  tags: string[];
  urls: {
    html: string;
    poster: string;
    thumbnail: string;
    hd: string;
    silent: string;
    sd: string;
  };
  userName: string;
  verified: boolean;
  views: number;
  width: number;
  promoted: unknown | null;
};
