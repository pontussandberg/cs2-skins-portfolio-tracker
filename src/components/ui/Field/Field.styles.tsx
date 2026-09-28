import styled from "styled-components";
import { eyebrow, mutedText, spanBothColumns } from "@/styles/shared";

export const Wrapper = styled.div<{ $wide?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  ${({ $wide }) => $wide && spanBothColumns}
`;

export const Label = styled.label`
  ${eyebrow}
`;

export const Hint = styled.p`
  ${mutedText}
`;
