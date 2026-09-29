import Link from "next/link";
import styled from "styled-components";
import { stretchedAction } from "@/components/ItemTile";
import { raised, truncate } from "@/styles/shared";
import { theme } from "@/styles/theme";

export const NameLink = styled.a`
  ${stretchedAction}
`;

export const WatchLink = styled(Link)`
  ${raised}
  ${truncate}
  font-weight: 500;
  color: ${theme.color.accent};

  &:hover {
    text-decoration: underline;
  }
`;
