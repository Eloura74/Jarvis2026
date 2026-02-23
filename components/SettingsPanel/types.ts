// Re-export depuis configService pour éviter le doublon
export type { JarvisSettings } from "../../services/configService";
export { DEFAULT_SETTINGS } from "../../services/configService";

export interface ThemeConfig {
  name: string;
  primary: string;
  border: string;
  bg: string;
}
