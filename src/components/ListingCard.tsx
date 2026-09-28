"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { formatFloat, formatFloatRank, formatPrice, formatStickerPercent, stickerLabel, timeAgo } from "@/core/format";
import { Badge } from "./ui";
import { ignore } from "@/lib/ignore";

interface StickerView {
  name: string;
  iconUrl?: string | null;
  slot?: number | null;
  wear?: number | null;
  price?: number | null;
}

export interface ListingView {
  id: string;
  name: string;
  price: number;
  type: string;
  seed?: number | null;
  float?: number | null;
  lowRank?: number | null;
  highRank?: number | null;
  stattrak: boolean;
  stickerDetails: StickerView[];
  stickerPercent?: number | null;
  createdAt: string;
  csfloatUrl: string;
  inspectLink?: string | null;
  iconUrl?: string | null;
}

function CopyInspect({ link }: { link: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  if (!link) return null;
  return (
    <button
      type="button"
      className="relative z-10 rounded px-1.5 py-0.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      onClick={() => {
        void navigator.clipboard.writeText(link).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }, ignore);
      }}
    >
      {copied ? "Copied" : "Copy inspect"}
    </button>
  );
}

/**
 * Market-style listing tile (like CSFloat's search grid): image with rank, badges and stickers on
 * top, then price, float with wear bar, and the item name. Used by the feed and a watch's listings.
 * The whole tile opens the listing on CSFloat: the name's link is stretched over it
 * (`after:inset-0`), and controls that do something else sit above it with `relative z-10`.
 */
export function ListingCard({
  listing,
  kind,
  priceBefore,
  watch,
}: {
  listing: ListingView;
  /** Feed event type, or a highlight for listings new in the last run. */
  kind?: "NEW" | "PRICE_DROP" | null;
  priceBefore?: number | null;
  watch?: { id: string; name: string } | null;
}) {
  const rank = formatFloatRank(listing);

  return (
    <article className={clsx("panel hoverable relative flex flex-col overflow-hidden", kind === "NEW" && "border-success-ink/50")}>
      <div className="relative aspect-[4/3] bg-[radial-gradient(ellipse_at_center,var(--color-surface-2)_0%,var(--color-surface)_70%)] p-4">
        <div className="absolute inset-x-2 top-2 flex items-start gap-2">
          {rank ? (
            <Badge tone="accent" caps={false} title="CSFloat float rank for this skin">
              {rank}
            </Badge>
          ) : null}
          <div className="ml-auto flex flex-wrap justify-end gap-1">
            {kind === "NEW" ? <Badge tone="success">New</Badge> : null}
            {kind === "PRICE_DROP" ? <Badge tone="danger">Price drop</Badge> : null}
            {listing.stattrak ? <Badge tone="warning">ST</Badge> : null}
            {listing.type === "auction" ? <Badge tone="info">Auction</Badge> : null}
          </div>
        </div>

        <div className="grid size-full place-items-center">
          {listing.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.iconUrl} alt={listing.name} loading="lazy" className="max-h-full w-full object-contain drop-shadow-[0_8px_16px_rgb(0_0_0/0.35)]" />
          ) : (
            <span className="text-3xl text-ink-muted" aria-hidden>
              ?
            </span>
          )}
        </div>

        <StickerRow stickers={listing.stickerDetails} />
        {listing.stickerPercent != null ? (
          <span
            className="absolute bottom-2 right-2 rounded bg-canvas/80 px-1.5 py-0.5 text-[0.7rem] font-semibold text-ink"
            title="Sticker percentage: share of the stickers' reference value asked on top of the skin's own price"
          >
            {formatStickerPercent(listing.stickerPercent)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-line p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="tabular text-lg font-bold">{formatPrice(listing.price)}</span>
          {priceBefore != null ? <span className="tabular text-xs text-ink-muted line-through">{formatPrice(priceBefore)}</span> : null}
        </div>

        {listing.float != null ? <FloatInfo value={listing.float} seed={listing.seed} /> : null}

        <h3 className="line-clamp-1 text-xs text-ink-muted" title={listing.name}>
          <a href={listing.csfloatUrl} target="_blank" rel="noreferrer" className="after:absolute after:inset-0 after:content-['']">
            {listing.name}
          </a>
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-ink-muted">
          {watch ? (
            <Link href={`/watches/${watch.id}`} className="relative z-10 truncate font-medium text-accent hover:underline">
              {watch.name}
            </Link>
          ) : (
            <span title={listing.createdAt}>{timeAgo(listing.createdAt)}</span>
          )}
          <CopyInspect link={listing.inspectLink} />
        </div>
      </div>
    </article>
  );
}

/** Column layout for a grid of ListingCards (feed, a watch's listings). */
export const LISTING_GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/** Sticker icons over the bottom of the image, in slot order. Name (and scrape) on hover. */
function StickerRow({ stickers }: { stickers: StickerView[] }) {
  if (stickers.length === 0) return null;
  return (
    <ul className="absolute bottom-2 left-2 z-10 flex items-center gap-1" aria-label="Stickers">
      {stickers.map((s, i) => {
        const title = `${stickerLabel(s.name)}${s.price != null ? ` · ${formatPrice(s.price)}` : ""}${s.wear ? ` · ${Math.round(s.wear * 100)}% scraped` : ""}`;
        return (
          // Index key: sticker crafts can put the same sticker in the same slot more than once.
          <li key={i} title={title}>
            {s.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.iconUrl} alt={title} loading="lazy" className={clsx("size-7 object-contain drop-shadow", s.wear && "opacity-60")} />
            ) : (
              <span className="block max-w-20 truncate rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] text-ink-muted">{title}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Wear ranges: Factory New, Minimal Wear, Field-Tested, Well-Worn, Battle-Scarred.
const WEAR = [
  { to: 0.07, label: "FN", className: "bg-wear-fn" },
  { to: 0.15, label: "MW", className: "bg-wear-mw" },
  { to: 0.38, label: "FT", className: "bg-wear-ft" },
  { to: 0.45, label: "WW", className: "bg-wear-ww" },
  { to: 1, label: "BS", className: "bg-wear-bs" },
];

/** Float value, wear label (FN…BS), optional seed, and the float bar. */
function FloatInfo({ value, seed }: { value: number; seed?: number | null }) {
  const wear = WEAR.find((w) => value < w.to) ?? WEAR[WEAR.length - 1]!;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="tabular font-mono text-ink">{formatFloat(value)}</span>
        <span className="font-semibold text-ink-muted">
          {wear.label}
          {seed != null ? <span className="font-normal"> · seed {seed}</span> : null}
        </span>
      </div>
      <FloatBar value={value} />
    </div>
  );
}

/** CSFloat-style float bar: the wear ranges, with a marker at this item's float. */
function FloatBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <div className="pointer-events-none relative" aria-hidden>
      <div className="flex h-1 overflow-hidden rounded-full opacity-80">
        {WEAR.map((w, i) => (
          <div key={w.label} className={w.className} style={{ width: `${(w.to - (WEAR[i - 1]?.to ?? 0)) * 100}%` }} />
        ))}
      </div>
      <div className="absolute -top-1 h-3 w-0.5 -translate-x-1/2 rounded-full bg-ink shadow-[0_0_0_2px_var(--color-surface)]" style={{ left: `${pct}%` }} />
    </div>
  );
}
