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

export function Providers({ children }) {
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
    <ThemeCtx.Provider value={{ theme: themes[themeName], setTheme }}>
      <ThemeProvider theme={themes[themeName]}>
        <GlobalStyles />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
