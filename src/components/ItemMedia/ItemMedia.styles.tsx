import styled from "styled-components";
import { raised, truncate } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

const { color } = theme;

export const Root = styled.div`
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

export const TopEnd = styled.div`
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

export const Corner = styled.span`
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

/** Raised so the hover titles work above a stretched card link. */
export const AttachmentList = styled.ul`
  ${raised}
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const AttachmentImage = styled.img<{ $scraped?: boolean }>`
  width: 1.75rem;
  height: 1.75rem;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.4));
  opacity: ${({ $scraped }) => ($scraped ? 0.6 : 1)};
`;

export const AttachmentText = styled.span`
  ${truncate}
  display: block;
  max-width: 5rem;
  border-radius: 0.25rem;
  background: ${color.surface2};
  padding: 0.125rem 0.375rem;
  font-size: 0.65rem;
  color: ${color.inkMuted};
`;
