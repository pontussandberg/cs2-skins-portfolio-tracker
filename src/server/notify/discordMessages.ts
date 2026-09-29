import { charmLabel, formatFloat, formatFloatRank, formatPercent, formatPrice, formatStickerPercent, iconUrl, listingUrl } from "@/core/format";
import { stickerPercent } from "@/core/listing";
import type { ListingSnap } from "@/core/types";

/** Discord allows at most 10 embeds per webhook message. */
export const MAX_EMBEDS = 10;
const MINT = 0x7ee0b5;

export interface DiscordEmbed {
  title: string;
  url: string;
  description: string;
  color: number;
  thumbnail?: { url: string };
  timestamp?: string;
}

export interface DiscordPayload {
  username: string;
  content: string;
  embeds: DiscordEmbed[];
  allowed_mentions: { parse: string[] };
}

export interface NewItemsMessage {
  watchName: string;
  watchUrl?: string | null;
  items: ListingSnap[];
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function listingEmbed(l: ListingSnap): DiscordEmbed {
  const rank = formatFloatRank(l);
  const titleParts = [l.name];
  if (l.seed != null) titleParts.push(`seed ${l.seed}`);
  const details = [
    `**${formatPrice(l.price)}**`,
    `float ${formatFloat(l.float)}${rank ? ` (${rank})` : ""}`,
    l.type === "auction" ? "auction" : "buy now",
  ];
  if (l.bluePercent != null) details.push(`${formatPercent(l.bluePercent)} blue`);
  if (l.fadePercent != null) details.push(`${formatPercent(l.fadePercent)} fade${l.fadeRank != null ? ` (#${l.fadeRank})` : ""}`);
  if (l.charms?.length) details.push(`charm: ${l.charms.map((c) => charmLabel(c.name)).join(", ")}`);
  if (l.stickers.length) {
    const sp = stickerPercent(l);
    details.push(`stickers: ${l.stickers.slice(0, 4).join(", ")}${sp != null ? ` (${formatStickerPercent(sp)})` : ""}`);
  }
  const thumb = iconUrl(l.iconUrl, 128);
  return {
    title: truncate(titleParts.join(" · "), 256),
    url: listingUrl(l.id),
    description: truncate(details.join(" · "), 4000),
    color: MINT,
    ...(thumb ? { thumbnail: { url: thumb } } : {}),
    timestamp: l.createdAt,
  };
}

/** Build one or more webhook payloads (10 embeds max each) for a run's new items. */
export function buildNewItemsPayloads({ watchName, watchUrl, items }: NewItemsMessage): DiscordPayload[] {
  if (items.length === 0) return [];
  const chunks: ListingSnap[][] = [];
  for (let i = 0; i < items.length; i += MAX_EMBEDS) chunks.push(items.slice(i, i + MAX_EMBEDS));
  const header = `**${items.length} new** · ${watchName}${watchUrl ? ` · <${watchUrl}>` : ""}`;
  return chunks.map((chunk, i) => ({
    username: "CS2 Skins Portfolio Tracker",
    content: truncate(chunks.length > 1 ? `${header} (${i + 1}/${chunks.length})` : header, 2000),
    embeds: chunk.map(listingEmbed),
    allowed_mentions: { parse: [] },
  }));
}
