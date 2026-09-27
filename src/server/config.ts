import path from "node:path";

export interface AppConfig {
  csfloatApiKey: string | null;
  discordWebhookUrl: string | null;
  appUrl: string | null;
  dataDir: string;
  timezone: string;
  minIntervalMs: number;
  logLevel: string;
}

function blankToNull(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const interval = Number.parseInt(env.CSFLOAT_MIN_INTERVAL_MS ?? "", 10);
  return {
    csfloatApiKey: blankToNull(env.CSFLOAT_API_KEY),
    discordWebhookUrl: blankToNull(env.DISCORD_WEBHOOK_URL),
    appUrl: blankToNull(env.APP_URL)?.replace(/\/+$/, "") ?? null,
    dataDir: path.resolve(blankToNull(env.DATA_DIR) ?? "./data"),
    timezone: blankToNull(env.TZ) ?? "Europe/Stockholm",
    minIntervalMs: Number.isFinite(interval) && interval >= 250 ? interval : 2000,
    logLevel: blankToNull(env.LOG_LEVEL) ?? "info",
  };
}
