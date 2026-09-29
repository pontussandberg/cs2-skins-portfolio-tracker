import styled from "styled-components";
import { raised } from "@/styles/shared";
import { theme } from "@/styles/theme";

export const StyledCopyButton = styled.button`
  ${raised}
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.color.inkMuted};
  transition:
    background-color ${theme.motion.fast},
    color ${theme.motion.fast};

  &:hover {
    background: ${theme.color.surface2};
    color: ${theme.color.ink};
  }
`;
