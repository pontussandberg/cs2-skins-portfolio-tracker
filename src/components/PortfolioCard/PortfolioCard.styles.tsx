import styled from "styled-components";
import { stretchedAction } from "@/components/ItemTile";
import { truncate } from "@/styles/shared";

export const EditButton = styled.button`
  ${stretchedAction}
  display: inline;
`;

export const Breakdown = styled.span`
  ${truncate}
`;
