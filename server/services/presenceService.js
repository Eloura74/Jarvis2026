/**
 * presenceService.js — Service de gestion de présence au bureau
 *
 * Gère l'inactivité utilisateur et l'extinction automatique des lumières via Home Assistant.
 */

import { broadcastEvent } from "../routes/events.js";

class PresenceService {
  constructor() {
    this.status = "PRESENT"; // "PRESENT" | "ABSENT"
    this.lastActivityTime = Date.now();
    this.inactivityTimeoutMs = 15 * 60 * 1000; // 15 minutes par défaut
    this.haLightEntity = "light.bureau"; // Entité HA par défaut
    this.checkIntervalId = null;
  }

  /**
   * Initialise le service de présence
   */
  start() {
    if (this.checkIntervalId) return;

    console.log("👤 [PresenceService] Service démarré (vérification toutes les 30s)");
    this.checkIntervalId = setInterval(() => this.checkInactivity(), 30 * 1000);
  }

  /**
   * Arrête le service
   */
  stop() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  /**
   * Signale une activité utilisateur (mouvement, commande vocale, etc.)
   */
  recordActivity() {
    this.lastActivityTime = Date.now();
    
    // Si l'utilisateur était absent, marquer le retour
    if (this.status === "ABSENT") {
      this.setStatus("PRESENT");
    }
  }

  /**
   * Met à jour le statut de présence
   */
  async setStatus(newStatus) {
    if (this.status === newStatus) return;

    const oldStatus = this.status;
    this.status = newStatus;
    console.log(`👤 [PresenceService] Changement d'état : ${oldStatus} ➔ ${newStatus}`);

    if (newStatus === "ABSENT") {
      await this.handleAway();
    } else if (newStatus === "PRESENT") {
      await this.handleReturn();
    }

    // Émettre un événement SSE vers l'UI
    broadcastEvent("PRESENCE_CHANGE", {
      status: this.status,
      timestamp: new Date().toISOString()
    }, newStatus === "ABSENT" ? "Monsieur est absent. Extinction des lumières du bureau." : "Bon retour au bureau, Monsieur.");
  }

  /**
   * Vérifie l'inactivité
   */
  checkInactivity() {
    const elapsed = Date.now() - this.lastActivityTime;
    if (this.status === "PRESENT" && elapsed >= this.inactivityTimeoutMs) {
      console.log(`👤 [PresenceService] Inactivité détectée (${Math.round(elapsed / 1000)}s)`);
      this.setStatus("ABSENT");
    }
  }

  /**
   * Action lors de l'absence : Extinction des lumières via Home Assistant
   */
  async handleAway() {
    try {
      console.log(`💡 [PresenceService] Extinction des lumières (${this.haLightEntity})...`);
      
      const haBaseUrl = process.env.HA_BASE_URL || "http://homeassistant.local:8123";
      const haToken = process.env.HA_TOKEN;

      if (haToken) {
        await fetch(`${haBaseUrl}/api/services/light/turn_off`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${haToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ entity_id: this.haLightEntity })
        });
        console.log(`✅ [PresenceService] Lumières éteintes via HA API`);
      } else {
        console.log(`ℹ️ [PresenceService] Token HA absent - simulation extinction lumières`);
      }
    } catch (error) {
      console.warn(`⚠️ [PresenceService] Erreur extinction lumières HA:`, error.message);
    }
  }

  /**
   * Action lors du retour au bureau
   */
  async handleReturn() {
    try {
      console.log(`💡 [PresenceService] Rallumage des lumières (${this.haLightEntity})...`);
      
      const haBaseUrl = process.env.HA_BASE_URL || "http://homeassistant.local:8123";
      const haToken = process.env.HA_TOKEN;

      if (haToken) {
        await fetch(`${haBaseUrl}/api/services/light/turn_on`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${haToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ entity_id: this.haLightEntity })
        });
      }
    } catch (error) {
      console.warn(`⚠️ [PresenceService] Erreur rallumage lumières HA:`, error.message);
    }
  }

  /**
   * Récupère le statut actuel
   */
  getStatusData() {
    const elapsed = Math.round((Date.now() - this.lastActivityTime) / 1000);
    return {
      status: this.status,
      inactivitySeconds: elapsed,
      timeoutMinutes: Math.round(this.inactivityTimeoutMs / 60000),
      targetLightEntity: this.haLightEntity
    };
  }

  /**
   * Met à jour la configuration
   */
  configure({ timeoutMinutes, lightEntity }) {
    if (timeoutMinutes && timeoutMinutes > 0) {
      this.inactivityTimeoutMs = timeoutMinutes * 60 * 1000;
    }
    if (lightEntity) {
      this.haLightEntity = lightEntity;
    }
    console.log(`⚙️ [PresenceService] Config mise à jour: ${this.inactivityTimeoutMs / 60000}min, entity: ${this.haLightEntity}`);
    return this.getStatusData();
  }
}

const presenceService = new PresenceService();
export default presenceService;
