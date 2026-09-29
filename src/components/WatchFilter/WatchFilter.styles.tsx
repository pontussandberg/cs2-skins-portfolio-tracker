import styled from "styled-components";
import { dialogPanel, eyebrow, mutedText, tabular, textLink, truncate } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

const { color } = theme;

export const Root = styled.div`
  position: relative;
`;

export const Panel = styled.div`
  ${dialogPanel}
  position: absolute;
  top: calc(100% + 0.375rem);
  left: 0;
  z-index: ${theme.z.popover};
  width: min(20rem, calc(100vw - 2rem));
  padding: 0.5rem;
`;

export const HeaderRow = styled.div`
  ${eyebrow}
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem 0.5rem;
`;

export const TextButton = styled.button`
  ${textLink}
  text-transform: none;
`;

export const List = styled.ul`
  max-height: 18rem;
  overflow-y: auto;
`;

export const Row = styled.label`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: 6px;
  padding: 0.4rem 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: ${alpha(color.surface2, 70)};
  }
  & > input {
    flex-shrink: 0;
    accent-color: ${color.accent};
  }
`;

export const Name = styled.span`
  ${truncate}
  flex: 1;
`;

export const Count = styled.span`
  ${mutedText}
  ${tabular}
`;
