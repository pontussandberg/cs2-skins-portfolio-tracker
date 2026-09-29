import Link from "next/link";
import styled, { css } from "styled-components";
import { DeleteWatchButton } from "@/components/DeleteWatchButton";
import { Card } from "@/components/ui";
import { mutedText, raised, stretchedLink, truncate, wrapRow } from "@/styles/shared";
import { theme } from "@/styles/theme";

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;

export const Grip = styled.button`
  ${raised}
  margin: -0.125rem 0 0 -0.5rem;
  border-radius: 0.25rem;
  padding-inline: 0.25rem;
  font-size: 1.125rem;
  line-height: 1;
  color: ${theme.color.inkMuted};
  cursor: grab;
  touch-action: none;

  &:hover {
    background: ${theme.color.surface2};
    color: ${theme.color.ink};
  }
  &:active {
    cursor: grabbing;
  }
`;

export const Main = styled.div`
  flex: 1;
  min-width: 0;
`;

export const Title = styled(Link)`
  ${truncate}
  ${stretchedLink}
  display: block;
  font-size: 1rem;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

export const ItemName = styled.p`
  ${truncate}
  font-size: 0.875rem;
`;

export const Meta = styled.p`
  ${mutedText}
`;

export const Status = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;
`;

export const ChipRow = styled.div`
  ${wrapRow}
`;

export const Summary = styled.p`
  font-size: 0.75rem;
`;

/** Defined after its parts so the disabled style can refer to them. */
export const Root = styled(Card)<{ $dragging?: boolean; $disabled?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  /* Disabled: fade the content; the Disabled badge and the actions stay at full strength. */
  ${({ $disabled }) =>
    $disabled &&
    css`
      & ${Main}, & > ${ChipRow}, & > ${Meta}, & > ${Summary} {
        opacity: 0.55;
      }
    `}

  ${({ $dragging }) =>
    $dragging &&
    css`
      z-index: ${theme.z.dragging};
      border-color: ${theme.color.accent};
      box-shadow: ${theme.shadow.lifted};
    `}
`;

/** Buttons and links here stay clickable above the card's stretched title link. */
export const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  border-top: 1px solid ${theme.color.line};
  padding-top: 0.75rem;

  & > :is(a, button) {
    ${raised}
  }
`;

export const DeleteButton = styled(DeleteWatchButton)`
  margin-left: auto;
`;
