"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { formatFloat, formatPrice, timeAgo } from "@/core/format";
import { Badge, Button, IconPlate, LinkButton } from "./ui";
import { ignore } from "@/lib/ignore";

export interface ListingView {
  id: string;
  name: string;
  price: number;
  type: string;
  seed?: number | null;
  float?: number | null;
  stattrak: boolean;
  stickers: string[];
  createdAt: string;
  csfloatUrl: string;
  inspectLink?: string | null;
  iconUrl?: string | null;
}

export function CopyInspect({ link }: { link: string | null | undefined }) {
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

/** Feed card: one listing on a clay card, icon on a clay plate. */
export function ListingCard({
  listing,
  kind,
  priceBefore,
  watch,
  at,
}: {
  listing: ListingView;
  kind: "NEW" | "PRICE_DROP";
  priceBefore?: number | null;
  watch?: { id: string; name: string } | null;
  at: string;
}) {
  return (
    <article className="clay clay-lift flex flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        <IconPlate src={listing.iconUrl} alt={listing.name} />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {kind === "NEW" ? (
              <Badge tone="mint">NEW</Badge>
            ) : (
              <Badge tone="peach" title={priceBefore != null ? `was ${formatPrice(priceBefore)}` : undefined}>
                PRICE DROP
              </Badge>
            )}
            {listing.stattrak ? <Badge tone="lemon">StatTrak</Badge> : null}
            {listing.type === "auction" ? <Badge tone="lilac">Auction</Badge> : null}
          </div>
          <h3 className="line-clamp-2 font-extrabold leading-snug" title={listing.name}>
            {listing.name}
          </h3>
          {watch ? (
            <Link href={`/watches/${watch.id}`} className="text-xs font-bold text-accent-strong hover:underline">
              {watch.name}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="clay-well grid grid-cols-3 gap-2 px-4 py-3 text-center">
        <Stat label="Price" value={formatPrice(listing.price)} strong sub={priceBefore != null ? `was ${formatPrice(priceBefore)}` : undefined} />
        <Stat label="Seed" value={listing.seed != null ? String(listing.seed) : "-"} />
        <Stat label="Float" value={formatFloat(listing.float, 5)} mono />
      </div>

      {listing.stickers.length ? <p className="line-clamp-1 text-xs text-ink-muted">Stickers: {listing.stickers.join(", ")}</p> : null}

      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-xs text-ink-muted" title={at}>
          listed {timeAgo(listing.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <CopyInspect link={listing.inspectLink} />
          <LinkButton href={listing.csfloatUrl} external tone="primary" size="sm">
            Open
          </LinkButton>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value, strong, mono, sub }: { label: string; value: string; strong?: boolean; mono?: boolean; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={clsx("tabular truncate", strong ? "text-base font-black" : "text-sm font-bold", mono && "font-mono")}>{value}</div>
      {sub ? <div className="tabular truncate text-[0.68rem] text-ink-muted line-through">{sub.replace("was ", "")}</div> : null}
    </div>
  );
}
