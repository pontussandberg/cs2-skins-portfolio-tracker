import Link from "next/link";
import styled from "styled-components";
import { stretchedAction } from "@/components/ItemTile";
import { raised, textLink, truncate } from "@/styles/shared";

export const NameLink = styled.a`
  ${stretchedAction}
`;

export const WatchLink = styled(Link)`
  ${raised}
  ${truncate}
  ${textLink}
`;
