import styled, { css } from "styled-components";
import { pulse } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

export type BadgeTone = "success" | "danger" | "warning" | "info" | "accent" | "neutral";

const { color } = theme;

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: color.success, fg: color.successInk },
  danger: { bg: color.danger, fg: color.dangerInk },
  warning: { bg: color.warning, fg: color.warningInk },
  info: { bg: color.info, fg: color.infoInk },
  accent: { bg: alpha(color.accent, 20), fg: color.accent },
  neutral: { bg: color.surface2, fg: color.inkMuted },
};

export const StyledBadge = styled.span<{ $tone: BadgeTone; $caps: boolean; $pulse?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${({ $tone }) => tones[$tone].bg};
  color: ${({ $tone }) => tones[$tone].fg};

  ${({ $caps }) =>
    $caps &&
    css`
      text-transform: uppercase;
      letter-spacing: 0.025em;
    `}
  ${({ $pulse }) =>
    $pulse &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
    `}
`;
