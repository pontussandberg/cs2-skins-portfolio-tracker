import { css, keyframes } from "styled-components";
import { alpha, media, theme } from "./theme";

/** Style snippets shared by several components. Components themselves live in src/components. */

export const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const pulse = keyframes`
  50% { opacity: 0.5; }
`;

/** Flat panel: the base of cards, tiles and dialogs. */
export const panel = css`
  background: ${theme.color.surface};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.card};
`;

/** Floating panel: dialogs and toasts. */
export const dialogPanel = css`
  ${panel}
  border-radius: ${theme.radius.dialog};
  box-shadow: ${theme.shadow.floating};
`;

/** Text inputs, textareas and selects. */
export const field = css`
  width: 100%;
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.control};
  background: ${theme.color.canvas};
  padding: 0.55rem 0.8rem;
  color: ${theme.color.ink};
  transition: border-color ${theme.motion.fast};

  &:hover {
    border-color: ${theme.color.lineStrong};
  }
  &:focus {
    outline: none;
    border-color: ${theme.color.accent};
    box-shadow: 0 0 0 3px ${alpha(theme.color.accent, 25)};
  }
  &::placeholder {
    color: ${theme.color.inkMuted};
    opacity: 0.7;
  }
`;

/** Interactive panels: brighter border and background on hover, no movement. */
export const hoverable = css`
  transition:
    border-color ${theme.motion.fast},
    background-color ${theme.motion.fast};

  &:hover {
    border-color: ${theme.color.lineStrong};
    background-color: color-mix(in srgb, ${theme.color.surface} 70%, ${theme.color.surface2});
  }
`;

export const tabular = css`
  font-variant-numeric: tabular-nums;
`;

/** Hides content visually but keeps it for screen readers and form behaviour. */
export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/**
 * Clickable cards: put `stretchedLink` on the card's main link to cover the whole card (the card
 * must be `position: relative`), and `raised` on other controls so they stay clickable above it.
 */
export const stretchedLink = css`
  &::after {
    content: "";
    position: absolute;
    inset: 0;
  }
`;

export const raised = css`
  position: relative;
  z-index: ${theme.z.raised};
`;

/** Muted helper/secondary text. */
export const mutedText = css`
  font-size: 0.75rem;
  color: ${theme.color.inkMuted};
`;

/** Secondary body text (0.875rem); `mutedText` is the small variant. */
export const mutedBody = css`
  font-size: 0.875rem;
  color: ${theme.color.inkMuted};
`;

/** Small uppercase label: form labels, table headers. */
export const eyebrow = css`
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: ${theme.color.inkMuted};
`;

/** Single line, cut off with an ellipsis. */
export const truncate = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** At most `lines` lines, cut off with an ellipsis. */
export const lineClamp = (lines: number) => css`
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: ${lines};
  -webkit-box-orient: vertical;
`;

/** Vertical stack with `gap` between children. */
export const stack = (gap: string) => css`
  display: flex;
  flex-direction: column;
  gap: ${gap};
`;

/** Wrapping row of chips/badges. */
export const wrapRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

/** Row of filter/sort controls above a grid; selects shrink to their content. */
export const toolbar = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;

  & > select {
    width: auto;
  }
`;

/** Full width in a two-column form grid (from the sm breakpoint). */
export const spanBothColumns = css`
  ${media.sm} {
    grid-column: span 2;
  }
`;

/** Centered page-width container, shared by the header and the page content so they line up. */
export const pageContainer = css`
  width: 100%;
  max-width: ${theme.layout.maxWidth};
  margin-inline: auto;
  padding-inline: 1rem;

  ${media.sm} {
    padding-inline: 1.5rem;
  }
`;
