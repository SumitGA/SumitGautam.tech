// Theme Presets

const lightTheme = {
  name: "light",
  body: "#FFFFFF",
  text: "#343434",
  dark: "#000000",
  // #7F8DAA measured 3.34:1 on white — below the 4.5:1 WCAG AA needs for body
  // text. This keeps the same blue-grey character at 5.35:1. The dark theme's
  // equivalent already passed at 5.08:1 and is unchanged.
  secondaryText: "#5F6B85",
  accentColor: "#E3405F",
  accentBright: "#FC1056",
  // White on accentBright measures 3.93:1 — fine for large text, short of the
  // 4.5:1 AA wants for button-sized labels. This is 8% darker, visually the
  // same red, and clears it at 4.55:1. Use it wherever accent is a solid fill
  // behind white text.
  accentSolid: "#E80F4F",
  projectCard: "#DCE4F2",
  skinColor: "#F7B799",
  skinColor2: "#FCB696",
  imageDark: "#dce4f2",
  imageClothes: "#dce4f2",
  avatarMisc: "#e9ecf2",
  avatarShoes: "#ccd2e3",
};

const darkTheme = {
  name: "dark",
  body: "#1D1D1D",
  text: "#FFFFFF",
  dark: "#000000",
  secondaryText: "#8D8D8D",
  accentColor: "#E3405F",
  accentBright: "#FC1056",
  accentSolid: "#E80F4F",
  projectCard: "#292A2D",
  skinColor: "#F7B799",
  skinColor2: "#FCB696",
  imageDark: "#292A2D",
  imageClothes: "#000000",
  avatarMisc: "#212121",
  avatarShoes: "#2B2B2B",
};

export const themes = { light: lightTheme, dark: darkTheme };
