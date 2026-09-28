import styled, { css } from "styled-components";
import { field } from "@/styles/shared";
import { theme } from "@/styles/theme";

export const StyledInput = styled.input<{ $mono?: boolean }>`
  ${field}
  ${({ $mono }) =>
    $mono &&
    css`
      font-family: ${theme.font.mono};
    `}
`;
