import styled, { css } from "styled-components";
import { Card } from "@/components/ui";
import { eyebrow, mutedBody, stack, tabular, wrapRow } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

export const Root = styled.div`
  ${stack("1.25rem")}
`;

export const HeaderCard = styled(Card)`
  ${stack("1rem")}
`;

export const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

export const Summary = styled.span`
  font-size: 0.875rem;
`;

export const ChipRow = styled.div`
  ${wrapRow}
`;

export const TableCard = styled(Card)`
  overflow-x: auto;
  padding: 0;
`;

export const Table = styled.table`
  width: 100%;
  min-width: 640px;
  font-size: 0.875rem;
`;

export const Tr = styled.tr<{ $hover?: boolean }>`
  border-bottom: 1px solid ${theme.color.line};

  tbody &:last-child {
    border-bottom: 0;
  }
  ${({ $hover }) =>
    $hover &&
    css`
      &:hover {
        background: ${alpha(theme.color.surface2, 50)};
      }
    `}
`;

export const Th = styled.th<{ $num?: boolean }>`
  ${eyebrow}
  padding: 0.5rem 0.75rem;
  text-align: ${({ $num }) => ($num ? "right" : "left")};
`;

export const Td = styled.td<{ $num?: boolean; $strong?: boolean; $capitalize?: boolean }>`
  padding: 0.5rem 0.75rem;
  ${({ $num }) =>
    $num &&
    css`
      ${tabular}
      text-align: right;
    `}
  ${({ $strong }) => $strong && "font-weight: 600;"}
  ${({ $capitalize }) => $capitalize && "text-transform: capitalize;"}
`;

export const DangerCard = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-color: ${alpha(theme.color.dangerInk, 30)};
`;

export const DangerTitle = styled.h2`
  font-weight: 600;
`;

export const DangerText = styled.p`
  ${mutedBody}
`;
