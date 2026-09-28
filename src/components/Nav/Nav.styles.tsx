import Link from "next/link";
import styled from "styled-components";
import { LinkButton } from "@/components/ui";
import { pageContainer } from "@/styles/shared";
import { alpha, media, theme } from "@/styles/theme";

export const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: ${theme.z.nav};
  border-bottom: 1px solid ${theme.color.line};
  background: ${alpha(theme.color.canvas, 85)};
  backdrop-filter: blur(8px);
`;

export const Inner = styled.div`
  ${pageContainer}
  display: flex;
  align-items: center;
  gap: 1.5rem;
  height: 3.5rem;
`;

export const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

export const Logo = styled.span`
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  background: ${theme.color.accent};
  font-size: 0.75rem;
  font-weight: 700;
  color: ${theme.color.accentInk};
`;

export const Name = styled.span`
  display: none;
  font-size: 0.875rem;
  font-weight: 600;

  ${media.sm} {
    display: block;
  }
`;

export const Links = styled.nav`
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
  height: 100%;
`;

export const NewWatchButton = styled(LinkButton)`
  margin-left: auto;
`;

export const ShortLabel = styled.span`
  ${media.sm} {
    display: none;
  }
`;

export const LongLabel = styled.span`
  display: none;

  ${media.sm} {
    display: inline;
  }
`;
