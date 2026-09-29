import styled, { css } from "styled-components";
import { Card } from "@/components/ui";
import { lineClamp, stretchedLink, tabular } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

const { color } = theme;

/** Item tile frame; render with `as="article" $lift`, ItemMedia on top and TileBody below. */
export const Tile = styled(Card)<{ $highlight?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;

  ${({ $highlight }) =>
    $highlight &&
    css`
      border-color: ${alpha(color.successInk, 50)};
    `}
`;

export const TileBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid ${color.line};
  padding: 0.75rem;
`;

export const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const Price = styled.span`
  ${tabular}
  font-size: 1.125rem;
  font-weight: 700;
`;

/** Secondary price next to Price (old price, market price). */
export const SubPrice = styled.span<{ $struck?: boolean }>`
  ${tabular}
  font-size: 0.75rem;
  color: ${color.inkMuted};
  ${({ $struck }) => $struck && "text-decoration: line-through;"}
`;

export const TileName = styled.h3`
  ${lineClamp(1)}
  font-size: 0.75rem;
  color: ${color.inkMuted};
`;

/** The tile's main action (a link or button), stretched over the whole tile. */
export const stretchedAction = css`
  ${stretchedLink}
  text-align: left;
`;

export const TileFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
  font-size: 0.75rem;
  color: ${color.inkMuted};
`;
