import Link from "next/link";
import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

const tab = css`
  display: flex;
  align-items: center;
  border-bottom: 2px solid transparent;
  padding-inline: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${theme.color.inkMuted};
  transition:
    color ${theme.motion.fast},
    border-color ${theme.motion.fast};

  &:hover {
    color: ${theme.color.ink};
  }
  &[aria-current="page"],
  &[aria-selected="true"] {
    border-color: ${theme.color.accent};
    color: ${theme.color.ink};
  }
`;

export const StyledTabList = styled.div`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid ${theme.color.line};
`;

export const StyledTab = styled.button`
  ${tab}
  margin-bottom: -1px;
  padding-block: 0.5rem;
`;

export const StyledTabLink = styled(Link)`
  ${tab}
`;
