import { useEffect } from "react";
import { checkBackendStatus } from "../services/backendApi";

import { LogEntry } from "../types";

type AddLogFn = (
  message: string,
  source?: LogEntry["source"],
  type?: LogEntry["type"],
) => void;

export function useBackendBootstrap({ addLog }: { addLog: AddLogFn }) {
  useEffect(() => {
    const verifyBackend = async () => {
      const isOnline = await checkBackendStatus();
      if (!isOnline) {
        addLog(
          "⚠️ BACKEND OFFLINE - Les commandes ne fonctionneront pas !",
          "SYSTEM",
          "error",
        );
        addLog(
          "💡 Démarrez le backend : cd server && node server.js",
          "SYSTEM",
          "warning",
        );
        console.error(
          "\n" +
            "═══════════════════════════════════════════════════════════\n" +
            "  ⚠️  BACKEND NON DÉMARRÉ\n" +
            "═══════════════════════════════════════════════════════════\n" +
            "\n" +
            "Le serveur backend (port 3001) n'est pas accessible.\n" +
            "\n" +
            "SOLUTION:\n" +
            "1. Ouvrez un nouveau terminal\n" +
            "2. Allez dans le dossier: cd server\n" +
            "3. Démarrez le serveur: node server.js\n" +
            "\n" +
            "OU utilisez le script automatique:\n" +
            "   Double-cliquez sur start-jarvis.bat\n" +
            "\n" +
            "═══════════════════════════════════════════════════════════\n",
        );
      } else {
        addLog("✅ Backend connecté (port 3001)", "SYSTEM", "success");
        console.log("✅ Backend online - Ready to execute commands");
      }
    };

    verifyBackend();
  }, [addLog]);
}
