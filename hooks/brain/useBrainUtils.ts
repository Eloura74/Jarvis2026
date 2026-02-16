/**
 * Utilitaires pour le Cerveau de J.A.R.V.I.S.
 */

/**
 * Détermine si un outil nécessite une synthèse vocale intelligente (résumé)
 * au lieu d'un simple message de succès.
 */
export const isRichTool = (toolName: string): boolean => {
  return (
    toolName.startsWith("gmail") ||
    toolName.startsWith("calendar") ||
    toolName === "get_weather" ||
    toolName === "set_timer" ||
    toolName === "consult_memory" ||
    toolName === "show_status_overlay"
  );
};

/**
 * Liste des outils qui peuvent initier une chaîne autonome
 * (ex: lire une page puis résumer/écrire).
 */
export const isChainableTool = (toolName: string): boolean => {
  return ["read_web_page", "analyze_screen", "gmail_read"].includes(toolName);
};
