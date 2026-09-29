import styled from "styled-components";
import { eyebrow, wrapRow } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

const { color } = theme;

/** Pill button; highlighted via aria-pressed (toggle), aria-checked (one of a group) or data-active. */
export const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 1.875rem;
  border: 1px solid ${color.line};
  border-radius: 9999px;
  background: ${color.canvas};
  padding-inline: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  color: ${color.inkMuted};
  transition:
    background-color ${theme.motion.fast},
    border-color ${theme.motion.fast},
    color ${theme.motion.fast};

  &:hover {
    border-color: ${color.lineStrong};
    color: ${color.ink};
  }
  &[aria-pressed="true"],
  &[aria-checked="true"],
  &[data-active="true"] {
    border-color: ${alpha(color.accent, 55)};
    background: ${alpha(color.accent, 14)};
    color: ${color.accent};
  }
`;

export const Check = styled.span`
  font-size: 0.75rem;
  line-height: 1;
`;

export const Group = styled.div`
  ${wrapRow}
  align-items: center;
`;

export const GroupLabel = styled.span`
  ${eyebrow}
  margin-right: 0.25rem;
`;
