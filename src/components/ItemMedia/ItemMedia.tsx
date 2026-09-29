"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import { formatFloatRank, formatPrice, formatScrape, stickerLabel } from "@/core/format";
import { AttachmentImage, AttachmentList, AttachmentText, Corner, ImageBox, ItemImage, Placeholder, Root, TopEnd, TopRow } from "./ItemMedia.styles";

/** A sticker or charm on an item. */
export interface AttachmentView {
  name: string;
  iconUrl?: string | null;
  wear?: number | null;
  price?: number | null;
}

/**
 * The image area of an item tile: item image on a soft spotlight, the float rank and badges along
 * the top, stickers and charms along the bottom (name, price and scrape on hover) and an optional
 * chip bottom-right.
 */
export function ItemMedia({
  iconUrl,
  name,
  rank,
  topEnd,
  attachments,
  corner,
}: {
  iconUrl: string | null | undefined;
  name: string;
  /** CSFloat float rank; shown as a badge when the item has one. */
  rank?: { lowRank?: number | null; highRank?: number | null };
  topEnd?: ReactNode;
  attachments: AttachmentView[];
  corner?: ReactNode;
}) {
  const rankText = rank ? formatFloatRank(rank) : null;
  return (
    <Root>
      <TopRow>
        {rankText ? (
          <Badge tone="accent" caps={false} title="CSFloat float rank for this skin">
            {rankText}
          </Badge>
        ) : null}
        <TopEnd>{topEnd}</TopEnd>
      </TopRow>

      <ImageBox>
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <ItemImage src={iconUrl} alt={name} loading="lazy" />
        ) : (
          <Placeholder aria-hidden>?</Placeholder>
        )}
      </ImageBox>

      {attachments.length ? (
        <AttachmentList aria-label="Stickers">
          {attachments.map((s, i) => {
            const title = [stickerLabel(s.name), s.price != null ? formatPrice(s.price) : null, formatScrape(s.wear)].filter(Boolean).join(" · ");
            return (
              // Index key: sticker crafts can put the same sticker in the same slot more than once.
              <li key={i} title={title}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.iconUrl ? <AttachmentImage src={s.iconUrl} alt={title} loading="lazy" $scraped={Boolean(s.wear)} /> : <AttachmentText>{title}</AttachmentText>}
              </li>
            );
          })}
        </AttachmentList>
      ) : null}
      {corner ? <Corner>{corner}</Corner> : null}
    </Root>
  );
}
