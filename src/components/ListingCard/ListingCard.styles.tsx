import Link from "next/link";
import styled, { css } from "styled-components";
import { Card } from "@/components/ui";
import { lineClamp, raised, stretchedLink, tabular, truncate } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

const { color } = theme;

/** Render with `as="article" $lift`. */
export const Tile = styled(Card)<{ $isNew?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;

  ${({ $isNew }) =>
    $isNew &&
    css`
      border-color: ${alpha(color.successInk, 50)};
    `}
`;

export const MediaArea = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  padding: 1rem;
  background: radial-gradient(ellipse at center, ${color.surface2} 0%, ${color.surface} 70%);
`;

export const TopRow = styled.div`
  position: absolute;
  inset-inline: 0.5rem;
  top: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

export const TopBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-left: auto;
`;

export const ImageBox = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
`;

export const ItemImage = styled.img`
  width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgb(0 0 0 / 0.35));
`;

export const Placeholder = styled.span`
  font-size: 1.875rem;
  color: ${color.inkMuted};
`;

export const SpChip = styled.span`
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  border-radius: 0.25rem;
  background: ${alpha(color.canvas, 80)};
  padding: 0.125rem 0.375rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${color.ink};
`;

export const StickerList = styled.ul`
  ${raised}
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const StickerImage = styled.img<{ $scraped?: boolean }>`
  width: 1.75rem;
  height: 1.75rem;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.4));
  opacity: ${({ $scraped }) => ($scraped ? 0.6 : 1)};
`;

export const StickerText = styled.span`
  ${truncate}
  display: block;
  max-width: 5rem;
  border-radius: 0.25rem;
  background: ${color.surface2};
  padding: 0.125rem 0.375rem;
  font-size: 0.65rem;
  color: ${color.inkMuted};
`;

export const Body = styled.div`
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

export const OldPrice = styled.span`
  ${tabular}
  font-size: 0.75rem;
  color: ${color.inkMuted};
  text-decoration: line-through;
`;

export const FloatColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const FloatRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.75rem;
`;

export const FloatValue = styled.span`
  ${tabular}
  font-family: ${theme.font.mono};
  color: ${color.ink};
`;

export const WearLabel = styled.span`
  font-weight: 600;
  color: ${color.inkMuted};
`;

export const Seed = styled.span`
  font-weight: 400;
`;

export const FloatBarRoot = styled.div`
  position: relative;
  pointer-events: none;
`;

export const Segments = styled.div`
  display: flex;
  height: 0.25rem;
  overflow: hidden;
  border-radius: 9999px;
  opacity: 0.8;
`;

export const Marker = styled.div`
  position: absolute;
  top: -0.25rem;
  width: 0.125rem;
  height: 0.75rem;
  transform: translateX(-50%);
  border-radius: 9999px;
  background: ${color.ink};
  box-shadow: 0 0 0 2px ${color.surface};
`;

export const Name = styled.h3`
  ${lineClamp(1)}
  font-size: 0.75rem;
  color: ${color.inkMuted};
`;

export const NameLink = styled.a`
  ${stretchedLink}
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
  font-size: 0.75rem;
  color: ${color.inkMuted};
`;

export const WatchLink = styled(Link)`
  ${raised}
  ${truncate}
  font-weight: 500;
  color: ${color.accent};

  &:hover {
    text-decoration: underline;
  }
`;

export const CopyButton = styled.button`
  ${raised}
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${color.inkMuted};
  transition:
    background-color ${theme.motion.fast},
    color ${theme.motion.fast};

  &:hover {
    background: ${color.surface2};
    color: ${color.ink};
  }
`;
