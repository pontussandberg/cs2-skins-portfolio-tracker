import styled, { css } from "styled-components";
import { alpha, theme } from "@/styles/theme";

export type ButtonTone = "primary" | "neutral" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const { color } = theme;

const tones: Record<ButtonTone, ReturnType<typeof css>> = {
  primary: css`
    background: ${color.accent};
    color: ${color.accentInk};
    &:hover:not(:disabled) {
      background: ${color.accentHover};
    }
  `,
  neutral: css`
    border-color: ${color.line};
    background: ${color.surface2};
    color: ${color.ink};
    &:hover:not(:disabled) {
      border-color: ${color.lineStrong};
    }
  `,
  danger: css`
    border-color: ${alpha(color.dangerInk, 30)};
    background: ${color.danger};
    color: ${color.dangerInk};
    &:hover:not(:disabled) {
      border-color: ${alpha(color.dangerInk, 60)};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${color.inkMuted};
    &:hover:not(:disabled) {
      background: ${color.surface2};
      color: ${color.ink};
    }
  `,
};

const sizes: Record<ButtonSize, ReturnType<typeof css>> = {
  sm: css`
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  `,
  md: css`
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  `,
  lg: css`
    padding: 0.625rem 1.25rem;
    font-size: 1rem;
  `,
};

type Variant = { $tone: ButtonTone; $size: ButtonSize };

const buttonStyles = css<Variant>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: ${theme.radius.control};
  font-weight: 600;
  line-height: 1.1;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  transition:
    background-color ${theme.motion.fast},
    border-color ${theme.motion.fast},
    opacity ${theme.motion.fast};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ $tone }) => tones[$tone]}
  ${({ $size }) => sizes[$size]}
`;

export const StyledButton = styled.button<Variant>`
  ${buttonStyles}
`;

/** Rendered `as={Link}` for internal links. */
export const StyledAnchor = styled.a<Variant>`
  ${buttonStyles}
`;
