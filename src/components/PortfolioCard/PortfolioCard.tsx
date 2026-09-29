"use client";

import { CopyInspect } from "@/components/CopyInspect";
import { FloatInfo } from "@/components/FloatInfo";
import { ItemMedia } from "@/components/ItemMedia";
import { Price, PriceRow, SubPrice, Tile, TileBody, TileFooter, TileName } from "@/components/ItemTile";
import { Badge } from "@/components/ui";
import { formatMultiple, formatPercent, formatPrice, formatSignedPrice } from "@/core/format";
import type { PortfolioQuery } from "@/graphql/__generated__/graphql";
import { Breakdown, EditButton } from "./PortfolioCard.styles";

export type PortfolioItemView = PortfolioQuery["portfolio"]["items"][number];

/** Your premiums as short labels: "2.2× skin", "35% SP". */
function premiumChips({ valuation, value }: PortfolioItemView): string[] {
  const chips: string[] = [];
  if (valuation?.skinPrice != null) chips.push("Fixed skin");
  else if (valuation?.multiplier != null && valuation.multiplier !== 1) chips.push(`${formatMultiple(valuation.multiplier)} skin`);
  if (value.stickers > 0 && value.craftPercent > 0) chips.push(`${formatPercent(value.craftPercent)} SP`);
  return chips;
}

/** What each part adds, e.g. "skin +$250.00 · craft +$197.00 of $563.00 stickers". */
function describeValue({ value }: PortfolioItemView): string {
  const parts: string[] = [];
  if (value.skin !== value.market) parts.push(`skin ${formatSignedPrice(value.skin - value.market)}`);
  if (value.stickers > 0) parts.push(value.craft > 0 ? `craft +${formatPrice(value.craft)} of ${formatPrice(value.stickers)} stickers` : `${formatPrice(value.stickers)} stickers, not valued`);
  if (value.charms > 0) parts.push(`charm ${formatPrice(value.charms)}`);
  return parts.length ? parts.join(" · ") : "Market value";
}

/**
 * Owned item tile. With `onEdit` the whole tile opens the valuation editor (the name button is
 * stretched over it); without it (history mode) the tile is read-only.
 */
export function PortfolioCard({ item, onEdit }: { item: PortfolioItemView; onEdit?: () => void }) {
  const { value } = item;
  const premium = value.total !== value.marketTotal;
  const chips = premiumChips(item);

  return (
    <Tile as="article" $lift={Boolean(onEdit)}>
      <ItemMedia
        iconUrl={item.iconUrl}
        name={item.name}
        rank={item}
        attachments={[...item.stickers, ...item.charms]}
        topEnd={
          <>
            {item.stattrak ? <Badge tone="warning">ST</Badge> : null}
            {item.souvenir ? <Badge tone="warning">Souvenir</Badge> : null}
            {item.csfloatUrl ? <Badge tone="info">Listed</Badge> : null}
            {!item.tradable ? <Badge>Trade hold</Badge> : null}
          </>
        }
        corner={
          chips.length ? (
            <span title="Your premiums: skin multiplier and sticker percentage (SP, share of the sticker value added)">{chips.join(" · ")}</span>
          ) : null
        }
      />

      <TileBody>
        <PriceRow>
          <Price title="Your value">{formatPrice(value.total)}</Price>
          {premium ? (
            <SubPrice title="Market value, and your value as a multiple of it">
              mkt {formatPrice(value.marketTotal)}
              {value.marketTotal > 0 ? ` · ${formatMultiple(value.total / value.marketTotal)}` : ""}
            </SubPrice>
          ) : null}
        </PriceRow>

        {item.float != null ? <FloatInfo value={item.float} seed={item.seed} /> : null}

        <TileName title={item.name}>
          {onEdit ? (
            <EditButton type="button" onClick={onEdit} aria-label={`Value ${item.name}`}>
              {item.name}
            </EditButton>
          ) : (
            item.name
          )}
        </TileName>

        <TileFooter>
          <Breakdown title={item.valuation?.note ?? undefined}>{describeValue(item)}</Breakdown>
          <CopyInspect link={item.inspectLink} />
        </TileFooter>
      </TileBody>
    </Tile>
  );
}
