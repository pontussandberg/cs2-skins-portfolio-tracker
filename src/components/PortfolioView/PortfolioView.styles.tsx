import styled from "styled-components";
import { Card, Input, Select } from "@/components/ui";
import { eyebrow, mutedText, stack, tabular, toolbar } from "@/styles/shared";
import { alpha, media, theme } from "@/styles/theme";

const { color } = theme;

export const Root = styled.div`
  ${stack("1.5rem")}
`;

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  ${media.lg} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export const Stat = styled(Card)<{ $accent?: boolean }>`
  ${stack("0.25rem")}
  padding: 1rem 1.25rem;
  ${({ $accent }) => $accent && `border-color: ${alpha(color.accent, 45)};`}
`;

export const StatLabel = styled.span`
  ${eyebrow}
`;

export const StatValue = styled.span<{ $positive?: boolean }>`
  ${tabular}
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${({ $positive }) => ($positive ? color.successInk : color.ink)};
`;

export const StatSub = styled.span`
  ${mutedText}
`;

export const Toolbar = styled.div`
  ${toolbar}
`;

export const Search = styled(Input)`
  flex: 1 1 14rem;
`;

export const DefaultCraft = styled.label`
  ${mutedText}
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  & > input {
    width: 5rem;
  }
`;

/** History picker in the page header. */
export const SnapshotSelect = styled(Select)`
  width: auto;
  max-width: 22rem;
`;
