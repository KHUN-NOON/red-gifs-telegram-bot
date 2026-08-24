import type { AuthTokenCache } from "./red-gifs.types.ts";

export class ApiAuthService {
  private static instance: ApiAuthService;
  private cache: AuthTokenCache = { token: null, expiresAt: null };
  private refreshPromise: Promise<string | null> | null = null;

  private constructor() {}

  public static getInstance(): ApiAuthService {
    if (!ApiAuthService.instance) {
      ApiAuthService.instance = new ApiAuthService();
    }
    return ApiAuthService.instance;
  }

  /**
   * Retrieves a valid token, refreshing automatically if expired or expiring within 60s.
   * Uses promise deduplication to prevent race conditions during concurrent runs.
   */
  public async getValidToken(): Promise<string | null> {
    const bufferMs = 60 * 1000; // 1-minute safety window
    const now = Date.now();

    if (
      this.cache.token &&
      this.cache.expiresAt &&
      this.cache.expiresAt - now > bufferMs
    ) {
      return this.cache.token;
    }

    // Prevent multiple concurrent login requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.fetchNewToken().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  /**
   * Performs the login or refresh call against the external identity provider.
   */
  private async fetchNewToken(): Promise<string | null> {
    const url = process.env.RED_GIFS_API;
    const response = await fetch(`${url}/auth/temporary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     clientId: process.env.API_CLIENT_ID,
      //     clientSecret: process.env.API_CLIENT_SECRET,
      //   }),
    });

    if (!response.ok) {
      throw new Error(`Auth failed with status: ${response.status}`);
    }

    const data: { token: string } = await response.json();

    this.cache = {
      token: data.token,
      // Default to 1 hour if expiresIn (in seconds) is omitted
      expiresAt: Date.now() + 3600 * 1000,
    };

    return this.cache.token;
  }

  public invalidateToken(): void {
    this.cache.token = null;
    this.cache.expiresAt = null;
  }
}
