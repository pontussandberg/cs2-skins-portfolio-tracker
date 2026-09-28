import styled from "styled-components";
import { pulse } from "@/styles/shared";
import { theme } from "@/styles/theme";

export const StyledSkeleton = styled.div`
  border-radius: ${theme.radius.card};
  background: ${theme.color.surface2};
  animation: ${pulse} 2s ease-in-out infinite;
`;
