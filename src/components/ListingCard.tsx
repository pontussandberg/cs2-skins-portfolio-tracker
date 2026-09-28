"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { formatFloat, formatFloatRank, formatPrice, stickerLabel, timeAgo } from "@/core/format";
import { Badge, Button, LinkButton } from "./ui";
import { ignore } from "@/lib/ignore";

interface StickerView {
  name: string;
  iconUrl?: string | null;
  slot?: number | null;
  wear?: number | null;
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
  createdAt: string;
  csfloatUrl: string;
  inspectLink?: string | null;
  iconUrl?: string | null;
}

function CopyInspect({ link }: { link: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  if (!link) return null;
  return (
    <Button
      size="sm"
      tone="ghost"
      onClick={() => {
        void navigator.clipboard.writeText(link).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }, ignore);
      }}
    >
      {copied ? "Copied" : "Copy inspect"}
    </Button>
  );
}

/**
 * Listing tile in the style of CSFloat's search grid: large item image with its stickers underneath,
 * then float (with wear bar), seed and price. Used by the feed and a watch's listings.
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
    <article className={clsx("clay clay-lift relative flex flex-col overflow-hidden", kind === "NEW" && "ring-2 ring-mint")}>
      <div className="relative bg-surface-2 px-4 pb-3 pt-9">
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {kind === "NEW" ? <Badge tone="mint">NEW</Badge> : null}
            {kind === "PRICE_DROP" ? <Badge tone="peach">PRICE DROP</Badge> : null}
            {listing.stattrak ? <Badge tone="lemon">StatTrak</Badge> : null}
            {listing.type === "auction" ? <Badge tone="lilac">Auction</Badge> : null}
          </div>
          {rank ? (
            <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-black text-accent-ink" title="CSFloat float rank for this skin">
              {rank}
            </span>
          ) : null}
        </div>

        <div className="grid aspect-[4/3] place-items-center">
          {listing.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.iconUrl} alt={listing.name} loading="lazy" className="max-h-full w-full object-contain drop-shadow-lg" />
          ) : (
            <span className="text-4xl text-ink-muted" aria-hidden>
              ?
            </span>
          )}
        </div>

        <StickerRow stickers={listing.stickerDetails} />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug" title={listing.name}>
            <a href={listing.csfloatUrl} target="_blank" rel="noreferrer" className="after:absolute after:inset-0 after:content-['']">
              {listing.name}
            </a>
          </h3>
          {watch ? (
            <Link href={`/watches/${watch.id}`} className="relative z-10 text-xs font-bold text-accent-strong hover:underline">
              {watch.name}
            </Link>
          ) : null}
        </div>

        {listing.float != null ? <FloatBar value={listing.float} /> : null}

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 text-xs text-ink-muted">
            <div className="tabular font-mono text-sm font-bold text-ink">{formatFloat(listing.float)}</div>
            {listing.seed != null ? <div className="tabular">Seed {listing.seed}</div> : null}
          </div>
          <div className="text-right">
            {priceBefore != null ? <div className="tabular text-xs text-ink-muted line-through">{formatPrice(priceBefore)}</div> : null}
            <div className="tabular text-lg font-black">{formatPrice(listing.price)}</div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink/10 pt-3">
          <span className="text-xs text-ink-muted" title={listing.createdAt}>
            {timeAgo(listing.createdAt)}
          </span>
          <div className="relative z-10 flex items-center gap-1">
            <CopyInspect link={listing.inspectLink} />
            <LinkButton href={listing.csfloatUrl} external tone="primary" size="sm">
              Open
            </LinkButton>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Sticker icons under the item image, in slot order. Name (and scrape) on hover. */
function StickerRow({ stickers }: { stickers: StickerView[] }) {
  if (stickers.length === 0) return <div className="h-9" aria-hidden />;
  return (
    <ul className="relative z-10 flex h-9 items-center justify-center gap-1.5" aria-label="Stickers">
      {stickers.map((s, i) => {
        const title = `${stickerLabel(s.name)}${s.wear ? ` · ${Math.round(s.wear * 100)}% scraped` : ""}`;
        return (
          <li key={`${s.slot ?? i}-${s.name}`} title={title}>
            {s.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.iconUrl} alt={title} loading="lazy" className={clsx("size-9 object-contain drop-shadow", s.wear && "opacity-60")} />
            ) : (
              <span className="block max-w-24 truncate rounded-full bg-surface px-2 py-0.5 text-[0.65rem] font-bold text-ink-muted">{title}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Wear ranges: Factory New, Minimal Wear, Field-Tested, Well-Worn, Battle-Scarred.
const WEAR = [
  { to: 0.07, label: "FN", className: "bg-mint" },
  { to: 0.15, label: "MW", className: "bg-accent" },
  { to: 0.38, label: "FT", className: "bg-lemon" },
  { to: 0.45, label: "WW", className: "bg-peach" },
  { to: 1, label: "BS", className: "bg-lilac" },
];

/** CSFloat-style float bar: the wear ranges, with a marker at this item's float. */
function FloatBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  const wear = WEAR.find((w) => value < w.to) ?? WEAR[WEAR.length - 1]!;
  return (
    <div className="pointer-events-none relative pt-1" aria-label={`${wear.label} · float ${value}`}>
      <div className="flex h-1.5 overflow-hidden rounded-full">
        {WEAR.map((w, i) => (
          <div key={w.label} className={w.className} style={{ width: `${(w.to - (WEAR[i - 1]?.to ?? 0)) * 100}%` }} />
        ))}
      </div>
      <div className="absolute top-0 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-ink" style={{ left: `${pct}%` }} aria-hidden />
    </div>
  );
}
