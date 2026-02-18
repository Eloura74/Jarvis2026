import { useEffect } from "react";

export function useGeminiBootstrap() {
  useEffect(() => {
    import("../services/geminiService").then((m) => {
      if (m.clearDecisionCache) m.clearDecisionCache();
      if (m.resetNeuralShield) {
        m.resetNeuralShield();
        console.log("🧠 JARVIS: Neural Shield reset for fresh session.");
      }
    });
  }, []);
}
