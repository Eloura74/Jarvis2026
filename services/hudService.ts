/**
 * Holographic HUD Service
 * Gère les notifications visuelles avancées.
 */

export interface HUDNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "alert" | "quantum";
  duration?: number;
}

/**
 * Simule l'affichage d'un élément holographique sur l'interface.
 */
export function triggerHolographicEntry(notif: HUDNotification) {
  console.log(`🌌 [HUD] Holographic Entry: ${notif.title} - ${notif.message}`);
  // Ici on pourrait ajouter un événement custom pour React
}
