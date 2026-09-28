import styled from "styled-components";
import { mutedBody, stack } from "@/styles/shared";
import { media } from "@/styles/theme";

export const Root = styled.div`
  ${stack("1.5rem")}
`;

export const Tip = styled.p`
  ${mutedBody}
`;

export const WatchGrid = styled.ul`
  display: grid;
  gap: 0.75rem;

  ${media.md} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.xl} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;
