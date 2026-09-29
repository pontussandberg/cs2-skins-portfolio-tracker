import type { ListingSnap, Watch } from "@/core/types";
import type { Logger } from "../logger";
import { buildNewItemsPayloads, type DiscordPayload } from "./discordMessages";

/** Posts to a Discord channel webhook. Failures are logged, never thrown into the run. */
export class DiscordNotifier {
  constructor(
    private webhookUrl: string | null,
    private appUrl: string | null,
    private logger: Logger,
    private fetchImpl: typeof fetch = fetch,
  ) {}

  get configured(): boolean {
    return Boolean(this.webhookUrl);
  }

  async notifyNewItems(watch: Pick<Watch, "id" | "name">, items: ListingSnap[]): Promise<void> {
    if (!this.webhookUrl || items.length === 0) return;
    const payloads = buildNewItemsPayloads({
      watchName: watch.name,
      watchUrl: this.appUrl ? `${this.appUrl}/watches/${watch.id}` : null,
      items,
    });
    for (const payload of payloads) {
      try {
        await this.post(payload);
      } catch (err) {
        this.logger.error({ err, watchId: watch.id }, "Discord notification failed");
        return;
      }
    }
  }

  /** Throws on failure so the UI can show the error. */
  async sendTest(): Promise<void> {
    if (!this.webhookUrl) throw new Error("DISCORD_WEBHOOK_URL is not set");
    await this.post({
      username: "CS2 Skins Portfolio Tracker",
      content: "Test message from CS2 Skins Portfolio Tracker: the webhook works. New items will show up here.",
      embeds: [],
      allowed_mentions: { parse: [] },
    });
  }

  private async post(payload: DiscordPayload): Promise<void> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let res: Response;
      try {
        res = await this.fetchImpl(this.webhookUrl!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        if (attempt >= 1) throw err;
        await sleep(1000);
        continue;
      }
      if (res.ok) return;
      if (res.status === 429) {
        const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
        const header = Number(res.headers.get("retry-after"));
        const seconds = body.retry_after ?? (Number.isFinite(header) ? header : 2);
        await sleep(Math.ceil(seconds * 1000) + 100);
        continue;
      }
      const text = await res.text().catch(() => "");
      if (attempt >= 1 || res.status < 500) throw new Error(`Discord HTTP ${res.status}: ${text.slice(0, 200)}`);
      await sleep(1000);
    }
    throw new Error("Discord kept rate limiting the webhook");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
