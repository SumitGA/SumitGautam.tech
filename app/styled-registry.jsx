"use client";
import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export default function StyledComponentsRegistry({ children }) {
  const [styledSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledSheet.getStyleElement();
    styledSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") return <>{children}</>;

  // StyleSheetManager runs React.Children.only on its children in development
  // only. App Router segments can hand us an array here, which trips that
  // assertion and 500s the route in dev while production is unaffected.
  // The fragment collapses them into the single element it expects.
  return (
    <StyleSheetManager sheet={styledSheet.instance}>
      <>{children}</>
    </StyleSheetManager>
  );
}
