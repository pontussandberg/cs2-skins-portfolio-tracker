"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";
import { GlobalStyle } from "@/styles/GlobalStyle";

/**
 * Collects styled-components CSS during server rendering and injects it into <head>, so pages
 * render styled on first paint (see node_modules/next/dist/docs/01-app/02-guides/css-in-js.md).
 */
export function StyledComponentsRegistry({ children }: { children: ReactNode }) {
  // Only create the stylesheet once.
  const [sheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return <>{styles}</>;
  });

  const content = (
    <>
      <GlobalStyle />
      {children}
    </>
  );
  if (typeof window !== "undefined") return content;
  return <StyleSheetManager sheet={sheet.instance}>{content}</StyleSheetManager>;
}
