import { toSnap, type ApiListing } from "@/core/listing";
import type { Page } from "@/core/paginate";
import type { Logger } from "../logger";
import { CsfloatAuthError, CsfloatHttpError } from "./errors";
import { parseResetHeader, RateGate } from "./rateGate";
import { parseListingsResponse } from "./schemas";

export { CsfloatAuthError, CsfloatHttpError };

export const CSFLOAT_API = "https://csfloat.com/api/v1";

export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  resetAt: number | null;
}

export interface CsfloatClientOptions {
  apiKey: string | null;
  gate: RateGate;
  logger: Logger;
  fetchImpl?: typeof fetch;
  maxRetries?: number;
}

/** Thin CSFloat client: auth header, shared rate gate, retries, response validation. */
export class CsfloatClient {
  private fetchImpl: typeof fetch;
  private maxRetries: number;
  public lastRateLimit: RateLimitInfo = { limit: null, remaining: null, resetAt: null };
  public requestCount = 0;

  constructor(private opts: CsfloatClientOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.maxRetries = opts.maxRetries ?? 3;
  }

  get configured(): boolean {
    return Boolean(this.opts.apiKey);
  }

  async fetchListingsPage(params: Record<string, string | number>, cursor: string | null): Promise<Page> {
    const { listings, cursor: next } = await this.fetchListings(params, cursor);
    return { items: listings.map(toSnap), cursor: next };
  }

  /** Validated API listings, before mapping to snapshots (keeps fields like sticker ids). */
  async fetchListings(params: Record<string, string | number>, cursor: string | null = null): Promise<{ listings: ApiListing[]; cursor: string | null }> {
    const url = new URL(`${CSFLOAT_API}/listings`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    if (cursor) url.searchParams.set("cursor", cursor);
    return parseListingsResponse(await this.request(url));
  }

  /** Raw request, also used by the spike script. Returns parsed JSON. */
  async request(url: URL): Promise<unknown> {
    if (!this.opts.apiKey) throw new CsfloatAuthError("CSFLOAT_API_KEY is not set");
    const log = this.opts.logger;

    for (let attempt = 0; ; attempt += 1) {
      await this.opts.gate.acquire();
      this.requestCount += 1;
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          headers: { Authorization: this.opts.apiKey, Accept: "application/json" },
        });
      } catch (err) {
        if (attempt >= this.maxRetries) throw err;
        await this.backoff(attempt);
        continue;
      }

      this.readRateLimit(res.headers);

      if (res.ok) return res.json();

      if (res.status === 401 || res.status === 403) {
        throw new CsfloatAuthError(`CSFloat rejected the API key (HTTP ${res.status})`);
      }
      if (res.status === 429 || res.status >= 500) {
        if (attempt >= this.maxRetries) {
          throw new CsfloatHttpError(res.status, `CSFloat HTTP ${res.status} after ${attempt + 1} attempts`);
        }
        if (res.status === 429) {
          const retryAfter = parseResetHeader(res.headers.get("retry-after"), Date.now());
          const until = retryAfter ?? this.lastRateLimit.resetAt ?? Date.now() + 60_000;
          log.warn({ until: new Date(until).toISOString() }, "CSFloat rate limited; pausing requests");
          this.opts.gate.pauseUntil(until);
        } else {
          await this.backoff(attempt);
        }
        continue;
      }
      const text = await res.text().catch(() => "");
      throw new CsfloatHttpError(res.status, `CSFloat HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
  }

  private readRateLimit(headers: Headers): void {
    const num = (name: string) => {
      const v = headers.get(name);
      const n = v == null ? NaN : Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const limit = num("x-ratelimit-limit");
    const remaining = num("x-ratelimit-remaining");
    const resetAt = parseResetHeader(headers.get("x-ratelimit-reset"), Date.now());
    if (limit !== null || remaining !== null || resetAt !== null) {
      this.lastRateLimit = { limit, remaining, resetAt };
    }
    if (remaining === 0 && resetAt) {
      this.opts.logger.info({ resetAt: new Date(resetAt).toISOString() }, "CSFloat quota used up; pausing until reset");
      this.opts.gate.pauseUntil(resetAt);
    }
  }

  private backoff(attempt: number): Promise<void> {
    const ms = Math.min(30_000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 250);
    return new Promise((r) => setTimeout(r, ms));
  }
}
