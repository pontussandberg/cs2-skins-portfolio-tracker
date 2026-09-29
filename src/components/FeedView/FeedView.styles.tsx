import styled from "styled-components";
import { mutedText, panel, stack, tabular, textLink, toolbar } from "@/styles/shared";
import { theme } from "@/styles/theme";

const { color } = theme;

export const Root = styled.div`
  ${stack("1.5rem")}
`;

/** One panel holding every filter, with the result count on the right. */
export const FilterBar = styled.section`
  ${panel}
  ${toolbar}
  gap: 0.75rem 1rem;
  padding: 0.625rem 0.75rem;
`;

export const Divider = styled.span`
  align-self: stretch;
  width: 1px;
  background: ${color.line};
`;

export const Summary = styled.p`
  ${mutedText}
  ${tabular}
  margin-left: auto;
  white-space: nowrap;
`;

export const ClearFilters = styled.button`
  ${textLink}
`;
