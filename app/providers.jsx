"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider } from "styled-components";
import { createGlobalStyle } from "styled-components";
import { themes } from "../src/theme";

const GlobalStyles = createGlobalStyle`
  body {
    background: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
  }
`;

const ThemeCtx = createContext({ theme: themes.dark, setTheme: () => {} });
export const useAppTheme = () => useContext(ThemeCtx);

// SiteData context — populated by layout.js (server) and consumed by any client component
const SiteDataCtx = createContext(null);
export const useSiteData = () => useContext(SiteDataCtx);

export function Providers({ children, siteData }) {
  const [themeName, setThemeState] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") setThemeState(saved);
  }, []);

  function setTheme(name) {
    setThemeState(name);
    localStorage.setItem("theme", name);
  }

  return (
    <SiteDataCtx.Provider value={siteData}>
      <ThemeCtx.Provider value={{ theme: themes[themeName], setTheme }}>
        {/* styled-components v5 ThemeProvider calls React.Children.only, so it
            must receive exactly one child — the fragment supplies that. Passing
            <GlobalStyles /> and {children} as siblings throws intermittently. */}
        <ThemeProvider theme={themes[themeName]}>
          <>
            <GlobalStyles />
            {children}
          </>
        </ThemeProvider>
      </ThemeCtx.Provider>
    </SiteDataCtx.Provider>
  );
}
