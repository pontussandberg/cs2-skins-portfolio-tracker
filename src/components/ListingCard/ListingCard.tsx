"use client";

import { useState } from "react";
import { formatFloat, formatFloatRank, formatPrice, formatStickerPercent, stickerLabel, timeAgo } from "@/core/format";
import { Badge } from "@/components/ui";
import { ignore } from "@/lib/ignore";
import { theme } from "@/styles/theme";
import {
  Body,
  CopyButton,
  FloatBarRoot,
  FloatColumn,
  FloatRow,
  FloatValue,
  Footer,
  ImageBox,
  ItemImage,
  Marker,
  MediaArea,
  Name,
  NameLink,
  OldPrice,
  Placeholder,
  Price,
  PriceRow,
  Seed,
  Segments,
  SpChip,
  StickerImage,
  StickerList,
  StickerText,
  Tile,
  TopBadges,
  TopRow,
  WatchLink,
  WearLabel,
} from "./ListingCard.styles";

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

/**
 * Market-style listing tile (like CSFloat's search grid): image with rank, badges and stickers on
 * top, then price, float with wear bar, and the item name. Used by the feed and a watch's listings.
 * The whole tile opens the listing on CSFloat: the name's link is stretched over it, and controls
 * that do something else are raised above it.
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
    <Tile as="article" $lift $isNew={kind === "NEW"}>
      <MediaArea>
        <TopRow>
          {rank ? (
            <Badge tone="accent" caps={false} title="CSFloat float rank for this skin">
              {rank}
            </Badge>
          ) : null}
          <TopBadges>
            {kind === "NEW" ? <Badge tone="success">New</Badge> : null}
            {kind === "PRICE_DROP" ? <Badge tone="danger">Price drop</Badge> : null}
            {listing.stattrak ? <Badge tone="warning">ST</Badge> : null}
            {listing.type === "auction" ? <Badge tone="info">Auction</Badge> : null}
          </TopBadges>
        </TopRow>

        <ImageBox>
          {listing.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <ItemImage src={listing.iconUrl} alt={listing.name} loading="lazy" />
          ) : (
            <Placeholder aria-hidden>?</Placeholder>
          )}
        </ImageBox>

        <StickerRow stickers={listing.stickerDetails} />
        {listing.stickerPercent != null ? (
          <SpChip title="Sticker percentage: share of the stickers' reference value asked on top of the skin's own price">
            {formatStickerPercent(listing.stickerPercent)}
          </SpChip>
        ) : null}
      </MediaArea>

      <Body>
        <PriceRow>
          <Price>{formatPrice(listing.price)}</Price>
          {priceBefore != null ? <OldPrice>{formatPrice(priceBefore)}</OldPrice> : null}
        </PriceRow>

        {listing.float != null ? <FloatInfo value={listing.float} seed={listing.seed} /> : null}

        <Name title={listing.name}>
          <NameLink href={listing.csfloatUrl} target="_blank" rel="noreferrer">
            {listing.name}
          </NameLink>
        </Name>

        <Footer>
          {watch ? <WatchLink href={`/watches/${watch.id}`}>{watch.name}</WatchLink> : <span title={listing.createdAt}>{timeAgo(listing.createdAt)}</span>}
          <CopyInspect link={listing.inspectLink} />
        </Footer>
      </Body>
    </Tile>
  );
}

function CopyInspect({ link }: { link: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  if (!link) return null;
  return (
    <CopyButton
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(link).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }, ignore);
      }}
    >
      {copied ? "Copied" : "Copy inspect"}
    </CopyButton>
  );
}

/** Sticker icons over the bottom of the image, in slot order. Name (and scrape) on hover. */
function StickerRow({ stickers }: { stickers: StickerView[] }) {
  if (stickers.length === 0) return null;
  return (
    <StickerList aria-label="Stickers">
      {stickers.map((s, i) => {
        const title = `${stickerLabel(s.name)}${s.price != null ? ` · ${formatPrice(s.price)}` : ""}${s.wear ? ` · ${Math.round(s.wear * 100)}% scraped` : ""}`;
        return (
          // Index key: sticker crafts can put the same sticker in the same slot more than once.
          <li key={i} title={title}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {s.iconUrl ? <StickerImage src={s.iconUrl} alt={title} loading="lazy" $scraped={Boolean(s.wear)} /> : <StickerText>{title}</StickerText>}
          </li>
        );
      })}
    </StickerList>
  );
}

// Wear ranges: Factory New, Minimal Wear, Field-Tested, Well-Worn, Battle-Scarred.
const WEAR = [
  { to: 0.07, label: "FN", color: theme.color.wear.fn },
  { to: 0.15, label: "MW", color: theme.color.wear.mw },
  { to: 0.38, label: "FT", color: theme.color.wear.ft },
  { to: 0.45, label: "WW", color: theme.color.wear.ww },
  { to: 1, label: "BS", color: theme.color.wear.bs },
];

/** Float value, wear label (FN…BS), optional seed, and the float bar. */
function FloatInfo({ value, seed }: { value: number; seed?: number | null }) {
  const wear = WEAR.find((w) => value < w.to) ?? WEAR[WEAR.length - 1]!;
  return (
    <FloatColumn>
      <FloatRow>
        <FloatValue>{formatFloat(value)}</FloatValue>
        <WearLabel>
          {wear.label}
          {seed != null ? <Seed> · seed {seed}</Seed> : null}
        </WearLabel>
      </FloatRow>
      <FloatBar value={value} />
    </FloatColumn>
  );
}

/** CSFloat-style float bar: the wear ranges, with a marker at this item's float. */
function FloatBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <FloatBarRoot aria-hidden>
      <Segments>
        {WEAR.map((w, i) => (
          <div key={w.label} style={{ width: `${(w.to - (WEAR[i - 1]?.to ?? 0)) * 100}%`, background: w.color }} />
        ))}
      </Segments>
      <Marker style={{ left: `${pct}%` }} />
    </FloatBarRoot>
  );
}
