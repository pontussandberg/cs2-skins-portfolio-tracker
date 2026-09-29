import Link from "next/link";
import styled from "styled-components";
import { stretchedAction } from "@/components/ItemTile";
import { raised, textLink, truncate } from "@/styles/shared";

export const NameLink = styled.a`
  ${stretchedAction}
`;

/** Card controls; raised above the stretched name link so they stay clickable. */
export const FooterActions = styled.div`
  ${raised}
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.25rem;
`;

export const WatchLink = styled(Link)`
  ${raised}
  ${truncate}
  ${textLink}
`;
