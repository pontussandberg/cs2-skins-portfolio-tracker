import styled from "styled-components";
import { spin } from "@/styles/shared";

export const StyledSpinner = styled.span<{ $small?: boolean }>`
  display: inline-block;
  width: ${({ $small }) => ($small ? "0.75rem" : "1rem")};
  height: ${({ $small }) => ($small ? "0.75rem" : "1rem")};
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 9999px;
  animation: ${spin} 0.9s linear infinite;
`;
