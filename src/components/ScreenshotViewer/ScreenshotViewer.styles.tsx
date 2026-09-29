import styled from "styled-components";
import { mutedBody } from "@/styles/shared";
import { theme } from "@/styles/theme";

/** 16:9 stage (CSFloat's screenshots are widescreen), so the dialog doesn't jump while loading. */
export const Frame = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  margin: 1rem 0 1.25rem;
  overflow: hidden;
  border-radius: ${theme.radius.control};
  background: ${theme.color.canvas};
`;

export const Image = styled.img<{ $hidden: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: ${({ $hidden }) => ($hidden ? "none" : "block")};
`;

export const Loading = styled.p`
  ${mutedBody}
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
