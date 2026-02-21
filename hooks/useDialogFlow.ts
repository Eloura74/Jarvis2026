/**
 * useDialogFlow - Gestionnaire de dialogues multi-étapes pour J.A.R.V.I.S.
 *
 * Permet d'intercepter les commandes avant Gemini quand un dialogue
 * est en attente (ex: composition WhatsApp en 2 étapes).
 *
 * Étapes WhatsApp :
 * 1. "Jarvis envoie un message à Laura" → demande le contenu
 * 2. L'utilisateur dicte le message → affiche overlay de confirmation
 * 3. "Valide / Modifie / Annule" → action correspondante
 */

import { useState, useCallback, useRef, useEffect } from "react";

// ============================================================================
// TYPES
// ============================================================================

export type DialogStep =
  | "idle"
  | "whatsapp_awaiting_message" // Étape 2 : attente du contenu du message
  | "whatsapp_awaiting_confirm"; // Étape 3 : attente validation/modif/annulation

export interface WhatsAppDialogState {
  step: DialogStep;
  recipient: string; // Nom du destinataire (ex: "Laura")
  recipientRaw: string; // Tel quel depuis Gemini (ex: "Laura" ou "33612345678@c.us")
  message: string; // Contenu du message en cours de composition
}

export interface DialogFlowResult {
  /** true = la commande a été interceptée par le dialog flow, ne pas passer à Gemini */
  intercepted: boolean;
}

interface UseDialogFlowProps {
  speak: (text: string, queue?: boolean) => void;
  addLog: (
    message: string,
    source?:
      | "SYSTEM"
      | "USER"
      | "OMNI"
      | "KERNEL"
      | "VOICE"
      | "GMAIL"
      | "CALENDAR",
    type?: "info" | "success" | "error" | "warning",
  ) => void;
  setStatusOverlay: (data: WhatsAppComposeOverlay | null) => void;
  onSendWhatsApp: (to: string, message: string) => Promise<void>;
  onSphereMode: (mode: string) => void;
}

export interface WhatsAppComposeOverlay {
  id: string;
  title: string;
  type: "whatsapp_compose";
  lastUpdate: string;
  recipient: string;
  message: string;
  step: DialogStep;
  stats: Array<{
    label: string;
    value: string;
    status?: "normal" | "warning" | "error";
    icon?: string;
  }>;
}

// ============================================================================
// MOTS-CLÉS DE CONFIRMATION / ANNULATION
// ============================================================================

const CONFIRM_KEYWORDS = [
  "valide",
  "validé",
  "confirme",
  "confirmé",
  "envoie",
  "envoyer",
  "oui",
  "ok",
  "c'est bon",
  "parfait",
  "vas-y",
];

const CANCEL_KEYWORDS = [
  "annule",
  "annulé",
  "annuler",
  "non",
  "stop",
  "laisse tomber",
  "oublie",
  "abandonne",
];

const MODIFY_KEYWORDS = [
  "modifie",
  "modifié",
  "modifier",
  "change",
  "corrige",
  "recommence",
  "autre chose",
  "différent",
];

// ============================================================================
// HOOK
// ============================================================================

export function useDialogFlow({
  speak,
  addLog,
  setStatusOverlay,
  onSendWhatsApp,
  onSphereMode,
}: UseDialogFlowProps) {
  const [dialogState, setDialogState] = useState<WhatsAppDialogState>({
    step: "idle",
    recipient: "",
    recipientRaw: "",
    message: "",
  });

  // Ref synchrone pour intercepter les commandes sans dépendances stale
  const dialogStateRef = useRef(dialogState);
  useEffect(() => {
    dialogStateRef.current = dialogState;
  }, [dialogState]);

  /**
   * Met à jour l'overlay de composition WhatsApp dans le dashboard
   */
  const updateComposeOverlay = useCallback(
    (state: WhatsAppDialogState) => {
      if (state.step === "idle") {
        setStatusOverlay(null);
        return;
      }

      const isAwaiting = state.step === "whatsapp_awaiting_message";

      setStatusOverlay({
        id: "whatsapp-compose",
        title: "Composition WhatsApp",
        type: "whatsapp_compose",
        lastUpdate: new Date().toLocaleTimeString(),
        recipient: state.recipient,
        message: state.message || "",
        step: state.step,
        stats: [
          {
            label: "Destinataire",
            value: state.recipient,
            status: "normal",
            icon: "fab fa-whatsapp",
          },
          {
            label: "Message",
            value: isAwaiting
              ? "En attente de votre message..."
              : state.message || "(vide)",
            status: isAwaiting ? "warning" : "normal",
            icon: "fas fa-comment-dots",
          },
          ...(state.step === "whatsapp_awaiting_confirm"
            ? [
                {
                  label: "Actions",
                  value: "Dites : Valide / Modifie / Annule",
                  status: "warning" as const,
                  icon: "fas fa-question-circle",
                },
              ]
            : []),
        ],
      });
    },
    [setStatusOverlay],
  );

  /**
   * Démarre le flow WhatsApp — appelé par le handler whatsapp_reply
   * quand Gemini détecte "envoie un message à XXX" sans contenu.
   */
  const startWhatsAppFlow = useCallback(
    (recipient: string, recipientRaw: string) => {
      const newState: WhatsAppDialogState = {
        step: "whatsapp_awaiting_message",
        recipient,
        recipientRaw,
        message: "",
      };

      setDialogState(newState);
      dialogStateRef.current = newState;
      updateComposeOverlay(newState);

      // Sphère en mode WHATSAPP
      onSphereMode("WHATSAPP");

      // Jarvis demande le contenu
      speak(
        `Quel message souhaitez-vous envoyer à ${recipient}, Monsieur ?`,
        false,
      );
      addLog(
        `📱 WhatsApp Flow : attente message pour ${recipient}`,
        "SYSTEM",
        "info",
      );
    },
    [speak, addLog, updateComposeOverlay, onSphereMode],
  );

  /**
   * Réinitialise le flow et ferme l'overlay
   */
  const resetFlow = useCallback(() => {
    const idle: WhatsAppDialogState = {
      step: "idle",
      recipient: "",
      recipientRaw: "",
      message: "",
    };
    setDialogState(idle);
    dialogStateRef.current = idle;
    setStatusOverlay(null);
    onSphereMode("IDLE");
  }, [setStatusOverlay, onSphereMode]);

  /**
   * Intercepte une commande utilisateur si un dialogue est en cours.
   * @returns { intercepted: true } si la commande a été traitée ici
   */
  const interceptCommand = useCallback(
    async (text: string): Promise<DialogFlowResult> => {
      const state = dialogStateRef.current;

      // Pas de dialogue en cours → laisser passer à Gemini
      if (state.step === "idle") {
        return { intercepted: false };
      }

      const textLower = text.toLowerCase().trim();

      // ================================================================
      // ÉTAPE 2 : Attente du contenu du message
      // ================================================================
      if (state.step === "whatsapp_awaiting_message") {
        // L'utilisateur a dicté le message → passer à la confirmation
        const newState: WhatsAppDialogState = {
          ...state,
          step: "whatsapp_awaiting_confirm",
          message: text,
        };
        setDialogState(newState);
        dialogStateRef.current = newState;
        updateComposeOverlay(newState);

        // Jarvis lit le message et demande confirmation
        speak(
          `Très bien. Je vais envoyer à ${state.recipient} : "${text}". Dites Valide pour envoyer, Modifie pour changer le message, ou Annule pour abandonner.`,
          false,
        );
        addLog(
          `📱 WhatsApp Flow : message composé, attente confirmation`,
          "SYSTEM",
          "info",
        );

        return { intercepted: true };
      }

      // ================================================================
      // ÉTAPE 3 : Attente de validation / modification / annulation
      // ================================================================
      if (state.step === "whatsapp_awaiting_confirm") {
        // ANNULATION
        if (CANCEL_KEYWORDS.some((k) => textLower.includes(k))) {
          speak("Message annulé, Monsieur.", false);
          addLog("📱 WhatsApp Flow : annulé", "SYSTEM", "info");
          resetFlow();
          return { intercepted: true };
        }

        // MODIFICATION → retour à l'étape 2
        if (MODIFY_KEYWORDS.some((k) => textLower.includes(k))) {
          const newState: WhatsAppDialogState = {
            ...state,
            step: "whatsapp_awaiting_message",
            message: "",
          };
          setDialogState(newState);
          dialogStateRef.current = newState;
          updateComposeOverlay(newState);

          speak(
            `D'accord, quel nouveau message souhaitez-vous envoyer à ${state.recipient} ?`,
            false,
          );
          addLog("📱 WhatsApp Flow : modification demandée", "SYSTEM", "info");
          return { intercepted: true };
        }

        // VALIDATION → envoi
        if (CONFIRM_KEYWORDS.some((k) => textLower.includes(k))) {
          speak(`Envoi du message à ${state.recipient} en cours...`, false);
          addLog(
            `📱 WhatsApp Flow : envoi à ${state.recipient}`,
            "SYSTEM",
            "info",
          );

          try {
            await onSendWhatsApp(state.recipientRaw, state.message);
            speak(`Message envoyé à ${state.recipient}, Monsieur.`, false);
            addLog(
              `✅ WhatsApp : message envoyé à ${state.recipient}`,
              "SYSTEM",
              "info",
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            speak(`Désolé, l'envoi a échoué. ${msg}`, false);
            addLog(`❌ WhatsApp : erreur envoi — ${msg}`, "SYSTEM", "error");
          }

          resetFlow();
          return { intercepted: true };
        }

        // Réponse non reconnue → rappeler les options
        speak(
          `Je n'ai pas compris, Monsieur. Dites Valide pour envoyer, Modifie pour changer le message, ou Annule pour abandonner.`,
          false,
        );
        return { intercepted: true };
      }

      return { intercepted: false };
    },
    [speak, addLog, updateComposeOverlay, onSendWhatsApp, resetFlow],
  );

  // Ref stable vers interceptCommand — toujours à jour, utilisable sans useEffect
  const interceptCommandRef = useRef(interceptCommand);
  useEffect(() => {
    interceptCommandRef.current = interceptCommand;
  }, [interceptCommand]);

  // Ref stable vers startWhatsAppFlow
  const startWhatsAppFlowRef = useRef(startWhatsAppFlow);
  useEffect(() => {
    startWhatsAppFlowRef.current = startWhatsAppFlow;
  }, [startWhatsAppFlow]);

  // Ref synchrone vers isDialogActive — utilisée par useJarvisInteraction
  // pour réduire le délai anti-écho à 800ms quand un dialogue est en cours
  const isDialogActiveRef = useRef(dialogState.step !== "idle");
  useEffect(() => {
    isDialogActiveRef.current = dialogState.step !== "idle";
  }, [dialogState.step]);

  return {
    dialogState,
    startWhatsAppFlow,
    startWhatsAppFlowRef,
    interceptCommand,
    interceptCommandRef,
    resetFlow,
    isDialogActive: dialogState.step !== "idle",
    isDialogActiveRef,
  };
}
