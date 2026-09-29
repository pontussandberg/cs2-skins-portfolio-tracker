import styled from "styled-components";
import { eyebrow, mutedBody, mutedText, stack, tabular, truncate, wrapRow } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

const { color } = theme;

export const Form = styled.form`
  ${stack("1.25rem")}
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const HeaderImage = styled.img`
  width: 5rem;
  height: 3.75rem;
  flex-shrink: 0;
  object-fit: contain;
`;

export const Subtitle = styled.p`
  ${mutedBody}
  ${tabular}
`;

export const Section = styled.section`
  ${stack("0.75rem")}
`;

export const SectionTitle = styled.h3`
  ${eyebrow}
`;

/** Segmented choice; the selected button has aria-checked or aria-pressed. */
export const Modes = styled.div`
  display: flex;
  gap: 0.25rem;
  border-radius: ${theme.radius.control};
  background: ${color.canvas};
  padding: 0.25rem;
`;

export const Mode = styled.button`
  flex: 1;
  border-radius: 6px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${color.inkMuted};
  transition:
    background-color ${theme.motion.fast},
    color ${theme.motion.fast};

  &:hover {
    color: ${color.ink};
  }
  &[aria-checked="true"],
  &[aria-pressed="true"] {
    background: ${color.surface2};
    color: ${color.ink};
  }
`;

export const Presets = styled.div`
  ${wrapRow}

  & > button {
    flex: 0 0 auto;
    background: ${color.canvas};
  }
`;

export const StickerList = styled.ul`
  ${stack("0.25rem")}
`;

export const StickerRow = styled.li`
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

export const StickerIcon = styled.img<{ $scraped?: boolean }>`
  width: 2rem;
  height: 2rem;
  object-fit: contain;
  opacity: ${({ $scraped }) => ($scraped ? 0.6 : 1)};
`;

export const StickerName = styled.span`
  ${truncate}
`;

export const StickerMeta = styled.span`
  ${mutedText}
  ${tabular}
`;

export const Summary = styled.div`
  ${stack("0.25rem")}
  border-radius: ${theme.radius.control};
  background: ${alpha(color.canvas, 70)};
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
`;

export const SummaryRow = styled.div`
  ${tabular}
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: ${color.inkMuted};
`;

export const SummaryTotal = styled(SummaryRow)`
  margin-top: 0.25rem;
  border-top: 1px solid ${color.line};
  padding-top: 0.5rem;
  font-weight: 600;
  color: ${color.ink};
`;

export const Spacer = styled.span`
  flex: 1;
`;
