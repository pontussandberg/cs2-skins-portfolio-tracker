// Small formatting helpers shared by UI, Discord and CLI. Dependency-free.

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatFloat(value: number | null | undefined, digits = 6): string {
  return value == null ? "-" : value.toFixed(digits);
}

export function listingUrl(id: string): string {
  return `https://csfloat.com/item/${id}`;
}

export function iconUrl(raw: string | null | undefined, size = 256): string | null {
  if (!raw) return null;
  if (/^https?:\/\//.test(raw)) return raw;
  return `https://community.cloudflare.steamstatic.com/economy/image/${raw}/${size}fx${size}f`;
}

export function timeAgo(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "never";
  const diff = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (diff < 0) {
    const ahead = -diff;
    if (ahead < 60) return `in ${ahead}s`;
    if (ahead < 3600) return `in ${Math.round(ahead / 60)} min`;
    if (ahead < 86400) return `in ${Math.round(ahead / 3600)} h`;
    return `in ${Math.round(ahead / 86400)} d`;
  }
  if (diff < 45) return "just now";
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return `${Math.round(diff / 86400)} d ago`;
}

export const SCHEDULE_PRESETS: { label: string; value: string | null }[] = [
  { label: "Manual only", value: null },
  { label: "Every 5 min", value: "*/5 * * * *" },
  { label: "Every 15 min", value: "*/15 * * * *" },
  { label: "Every 30 min", value: "*/30 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
];

export function describeSchedule(schedule: string | null): string {
  if (!schedule) return "Manual";
  return SCHEDULE_PRESETS.find((p) => p.value === schedule)?.label ?? schedule;
}

export const CATEGORY_LABELS: Record<number, string> = {
  0: "Any",
  1: "Normal",
  2: "StatTrak",
  3: "Souvenir",
};
