import { createGlobalStyle } from "styled-components";
import { theme } from "./theme";

/** Browser reset plus base document styles. */
export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
  }

  html {
    color-scheme: dark;
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
  }

  body {
    min-height: 100dvh;
    background: ${theme.color.canvas};
    color: ${theme.color.ink};
    font-family: ${theme.font.sans};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4 {
    font-size: inherit;
    font-weight: inherit;
  }

  a {
    color: inherit;
    text-decoration: inherit;
  }

  ul, ol {
    list-style: none;
  }

  img, svg {
    display: block;
    max-width: 100%;
  }

  button, input, select, textarea {
    font: inherit;
    color: inherit;
    background: transparent;
  }

  button {
    cursor: pointer;
  }

  table {
    border-collapse: collapse;
  }

  dialog {
    color: inherit;
  }

  :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
    outline: 2px solid ${theme.color.accent};
    outline-offset: 2px;
  }

  ::selection {
    background: ${theme.color.lineStrong};
    color: ${theme.color.ink};
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;
