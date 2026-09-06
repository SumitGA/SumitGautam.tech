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
  projectCard: "#292A2D",
  skinColor: "#F7B799",
  skinColor2: "#FCB696",
  imageDark: "#292A2D",
  imageClothes: "#000000",
  avatarMisc: "#212121",
  avatarShoes: "#2B2B2B",
};

export const themes = { light: lightTheme, dark: darkTheme };
