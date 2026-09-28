import styled from "styled-components";
import { hoverable, panel } from "@/styles/shared";

/** Flat panel. `$lift` adds the hover highlight for clickable cards. Supports `as`, refs and `styled(Card)`. */
export const Card = styled.div<{ $lift?: boolean }>`
  ${panel}
  padding: 1.25rem;
  ${({ $lift }) => $lift && hoverable}
`;
