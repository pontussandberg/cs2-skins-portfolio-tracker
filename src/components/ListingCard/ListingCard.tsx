"use client";

import { CopyInspect } from "@/components/CopyInspect";
import { FloatInfo } from "@/components/FloatInfo";
import { ItemMedia, type AttachmentView } from "@/components/ItemMedia";
import { Price, PriceRow, SubPrice, Tile, TileBody, TileFooter, TileName } from "@/components/ItemTile";
import { ScreenshotViewer } from "@/components/ScreenshotViewer";
import { Badge } from "@/components/ui";
import { formatPercent, formatPrice, formatStickerPercent, timeAgo } from "@/core/format";
import { FooterActions, NameLink, WatchLink } from "./ListingCard.styles";

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
  stickerDetails: AttachmentView[];
  stickerPercent?: number | null;
  charms?: AttachmentView[];
  bluePercent?: number | null;
  fadePercent?: number | null;
  fadeRank?: number | null;
  screenshots?: { playside: string; backside: string } | null;
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

  return (
    <Tile as="article" $lift $highlight={kind === "NEW"}>
      <ItemMedia
        iconUrl={listing.iconUrl}
        name={listing.name}
        rank={listing}
        attachments={[...listing.stickerDetails, ...(listing.charms ?? [])]}
        topEnd={
          <>
            {kind === "NEW" ? <Badge tone="success">New</Badge> : null}
            {kind === "PRICE_DROP" ? <Badge tone="danger">Price drop</Badge> : null}
            {listing.bluePercent != null ? (
              <Badge tone="info" caps={false} title="Case Hardened blue % (play side)">
                {formatPercent(listing.bluePercent)} blue
              </Badge>
            ) : null}
            {listing.fadePercent != null ? (
              <Badge tone="warning" caps={false} title={`Fade %${listing.fadeRank != null ? `, rank #${listing.fadeRank} for this skin` : ""}`}>
                {formatPercent(listing.fadePercent)} fade
              </Badge>
            ) : null}
            {listing.stattrak ? <Badge tone="warning">ST</Badge> : null}
            {listing.type === "auction" ? <Badge tone="info">Auction</Badge> : null}
          </>
        }
        corner={
          listing.stickerPercent != null ? (
            <span title="Sticker percentage: share of the stickers' reference value asked on top of the skin's own price">
              {formatStickerPercent(listing.stickerPercent)}
            </span>
          ) : null
        }
      />

      <TileBody>
        <PriceRow>
          <Price>{formatPrice(listing.price)}</Price>
          {priceBefore != null ? <SubPrice $struck>{formatPrice(priceBefore)}</SubPrice> : null}
        </PriceRow>

        {listing.float != null ? <FloatInfo value={listing.float} seed={listing.seed} /> : null}

        <TileName title={listing.name}>
          <NameLink href={listing.csfloatUrl} target="_blank" rel="noreferrer">
            {listing.name}
          </NameLink>
        </TileName>

        <TileFooter>
          {watch ? <WatchLink href={`/watches/${watch.id}`}>{watch.name}</WatchLink> : <span title={listing.createdAt}>{timeAgo(listing.createdAt)}</span>}
          <FooterActions>
            {listing.screenshots ? <ScreenshotViewer name={listing.name} screenshots={listing.screenshots} csfloatUrl={listing.csfloatUrl} /> : null}
            <CopyInspect link={listing.inspectLink} />
          </FooterActions>
        </TileFooter>
      </TileBody>
    </Tile>
  );
}
