/** Configuration utilisateur persistante */
export interface JarvisSettings {
  /** Wake word activé */
  wakeWordEnabled: boolean;
  /** Langue reconnaissance vocale */
  voiceLanguage: "fr-FR" | "en-US" | "en-GB";
  /** Seuil confiance wake word (0-1) */
  wakeWordThreshold: number;
  /** Volume synthèse vocale (0-1) */
  voiceVolume: number;
  /** Thème de couleurs */
  theme: "classic" | "ironman" | "matrix";
}

/** Paramètres par défaut */
export const DEFAULT_SETTINGS: JarvisSettings = {
  wakeWordEnabled: false,
  voiceLanguage: "fr-FR",
  wakeWordThreshold: 0.6,
  voiceVolume: 1.0,
  theme: "classic",
};

export interface ThemeConfig {
  name: string;
  primary: string;
  border: string;
  bg: string;
}
