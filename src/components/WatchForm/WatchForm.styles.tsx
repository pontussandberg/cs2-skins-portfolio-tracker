import styled from "styled-components";
import { Button, Card } from "@/components/ui";
import { mutedBody, mutedText, spanBothColumns, stack } from "@/styles/shared";
import { media, theme } from "@/styles/theme";

export const Form = styled.form`
  ${stack("1.5rem")}
`;

export const Section = styled(Card)`
  ${stack("0.75rem")}
`;

/** Card with a two-column field grid from the sm breakpoint. */
export const GridSection = styled(Card)`
  display: grid;
  gap: 1.25rem;

  ${media.sm} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const SectionTitleRoot = styled.div<{ $wide?: boolean }>`
  ${({ $wide }) => $wide && spanBothColumns}
`;

export const SectionHeading = styled.h2`
  font-size: 0.875rem;
  font-weight: 600;
`;

export const SectionHint = styled.p`
  ${mutedBody}
`;

export const ImportRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  ${media.sm} {
    flex-direction: row;
  }
`;

export const ImportButton = styled(Button)`
  flex-shrink: 0;
`;

export const ImportNote = styled.p`
  font-size: 0.875rem;
  color: ${theme.color.successInk};
`;

export const SeedHint = styled.p`
  ${mutedText}
  padding-inline: 0.25rem;
`;

export const TogglePanel = styled.div`
  ${spanBothColumns}
  ${stack("0.5rem")}
  border-radius: ${theme.radius.control};
  background: ${theme.color.surface2};
  padding: 0.75rem;
`;

export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;
