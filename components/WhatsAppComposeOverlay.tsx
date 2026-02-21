/**
 * WhatsAppComposeOverlay - Overlay holographique de composition WhatsApp
 *
 * Affiché pendant le flow 2 étapes :
 * - Étape 1 : destinataire affiché, message "En attente..."
 * - Étape 2 : destinataire + message affiché, boutons Valide/Modifie/Annule
 *
 * L'utilisateur interagit vocalement (pas de clavier).
 * Les boutons sont cliquables en secours.
 */

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, User, Send, Edit3, X, Clock } from "lucide-react";
import { StatusOverlayData } from "../types/app.types";

interface WhatsAppComposeOverlayPanelProps {
  data: StatusOverlayData | null;
  isVisible: boolean;
  onClose: () => void;
}

export function WhatsAppComposeOverlayPanel({
  data,
  isVisible,
}: WhatsAppComposeOverlayPanelProps) {
  if (!data) return null;

  const recipient = (data as unknown as { recipient: string }).recipient || "";
  const message = (data as unknown as { message: string }).message || "";
  const step = (data as unknown as { step: string }).step || "whatsapp_awaiting_message";
  const isAwaiting = step === "whatsapp_awaiting_message";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[9000] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop léger */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" />

          {/* Panel principal */}
          <motion.div
            className="relative z-10 pointer-events-auto w-full max-w-lg mx-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,20,40,0.97) 0%, rgba(0,40,20,0.97) 100%)",
              border: "1px solid rgba(0,255,128,0.4)",
              borderRadius: "16px",
              boxShadow:
                "0 0 40px rgba(0,255,128,0.15), 0 0 80px rgba(0,255,128,0.05), inset 0 0 40px rgba(0,255,128,0.03)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-6 py-4 border-b"
              style={{ borderColor: "rgba(0,255,128,0.2)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(0,255,128,0.15)",
                  border: "1px solid rgba(0,255,128,0.4)",
                }}
              >
                <MessageCircle size={20} className="text-green-400" />
              </div>
              <div>
                <div
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: "rgba(0,255,128,0.6)" }}
                >
                  WhatsApp — Composition
                </div>
                <div className="text-white font-semibold text-sm">
                  Message en cours
                </div>
              </div>

              {/* Indicateur pulsant */}
              <div className="ml-auto flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-green-400"
                />
                <span
                  className="text-xs font-mono"
                  style={{ color: "rgba(0,255,128,0.6)" }}
                >
                  {isAwaiting ? "EN ATTENTE" : "CONFIRMATION"}
                </span>
              </div>
            </div>

            {/* Corps */}
            <div className="px-6 py-5 space-y-4">
              {/* Destinataire */}
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{
                  background: "rgba(0,255,128,0.06)",
                  border: "1px solid rgba(0,255,128,0.15)",
                }}
              >
                <User size={16} className="text-green-400 shrink-0" />
                <div>
                  <div
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: "rgba(0,255,128,0.5)" }}
                  >
                    Destinataire
                  </div>
                  <div className="text-white font-semibold text-base">
                    {recipient}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div
                className="p-4 rounded-lg min-h-[100px]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${isAwaiting ? "rgba(255,200,0,0.3)" : "rgba(0,255,128,0.25)"}`,
                }}
              >
                <div
                  className="text-xs font-mono uppercase tracking-wider mb-2"
                  style={{
                    color: isAwaiting
                      ? "rgba(255,200,0,0.6)"
                      : "rgba(0,255,128,0.5)",
                  }}
                >
                  Message
                </div>

                {isAwaiting ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Clock
                        size={14}
                        style={{ color: "rgba(255,200,0,0.7)" }}
                      />
                    </motion.div>
                    <span
                      className="text-sm italic"
                      style={{ color: "rgba(255,200,0,0.7)" }}
                    >
                      En attente de votre message vocal...
                    </span>
                  </div>
                ) : (
                  <p className="text-white text-sm leading-relaxed">
                    "{message}"
                  </p>
                )}
              </div>

              {/* Instructions vocales */}
              {!isAwaiting && (
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: "rgba(0,255,128,0.05)",
                    border: "1px solid rgba(0,255,128,0.15)",
                  }}
                >
                  <div
                    className="text-xs font-mono uppercase tracking-wider mb-2"
                    style={{ color: "rgba(0,255,128,0.5)" }}
                  >
                    Commandes vocales
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <VoiceAction icon={<Send size={12} />} label="Valide" color="green" />
                    <VoiceAction icon={<Edit3 size={12} />} label="Modifie" color="yellow" />
                    <VoiceAction icon={<X size={12} />} label="Annule" color="red" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-3 border-t flex items-center justify-between"
              style={{ borderColor: "rgba(0,255,128,0.1)" }}
            >
              <span
                className="text-xs font-mono"
                style={{ color: "rgba(0,255,128,0.3)" }}
              >
                J.A.R.V.I.S. — WhatsApp Protocol
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "rgba(0,255,128,0.3)" }}
              >
                {data.lastUpdate}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VoiceAction({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: "green" | "yellow" | "red";
}) {
  const colors = {
    green: {
      bg: "rgba(0,255,128,0.1)",
      border: "rgba(0,255,128,0.3)",
      text: "#00ff80",
    },
    yellow: {
      bg: "rgba(255,200,0,0.1)",
      border: "rgba(255,200,0,0.3)",
      text: "#ffc800",
    },
    red: {
      bg: "rgba(255,60,60,0.1)",
      border: "rgba(255,60,60,0.3)",
      text: "#ff3c3c",
    },
  };

  const c = colors[color];

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      {icon}
      {label}
    </div>
  );
}
