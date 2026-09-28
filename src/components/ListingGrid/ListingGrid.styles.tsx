import styled from "styled-components";
import { media } from "@/styles/theme";

export const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  /* Let each tile fill its cell. */
  & > li {
    display: grid;
  }

  ${media.sm} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  ${media.lg} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  ${media.xl} {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
`;
