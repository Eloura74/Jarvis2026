import { JarvisSettings, ThemeConfig } from "./types";

/**
 * Obtenir configuration thème
 */
export const getThemeConfig = (theme: JarvisSettings["theme"]): ThemeConfig => {
  switch (theme) {
    case "ironman":
      return {
        name: "Iron Man",
        primary: "text-yellow-400",
        border: "border-yellow-500/30",
        bg: "bg-yellow-500/10",
      };
    case "matrix":
      return {
        name: "Matrix",
        primary: "text-green-400",
        border: "border-green-500/30",
        bg: "bg-green-500/10",
      };
    default:
      return {
        name: "Classic",
        primary: "text-cyan-400",
        border: "border-cyan-500/30",
        bg: "bg-cyan-500/10",
      };
  }
};
