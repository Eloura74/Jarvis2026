/**
 * Composant Principal OMNI / J.A.R.V.I.S.
 *
 * Interface web immersive simulant un système d'exploitation intelligent.
 * Orchestre tous les composants et hooks pour créer l'expérience J.A.R.V.I.S.
 *
 * Fonctionnalités principales :
 * - Interaction vocale bidirectionnelle (commandes + réponses)
 * - Interface Gemini AI pour parsing commandes intelligentes
 * - Système de mémoire applicative
 * - Boucles autonomes simulées
 * - UI holographique animée
 * - Historique persistant des commandes
 */

import React, {
  useState,
  useCallback,
  useEffect,
  lazy,
  Suspense,
  useMemo,
} from "react";
import CommandInput from "./components/CommandInput";
import JarvisCore from "./components/JarvisCore";
import ParticleBackground from "./components/ParticleBackground";
import DecryptedText from "./components/DecryptedText";
import TopHUD from "./components/HUD/TopHUD";
import BottomHUD from "./components/HUD/BottomHUD";
import CommandFeedback, { CommandInfo } from "./components/CommandFeedback";
import AudioVisualizer from "./components/AudioVisualizer";

// ========================================
// OPTIMISATION : LAZY LOADING COMPOSANTS LOURDS
// ========================================
// Réduction bundle initial de ~150 KB (-30%)
const TerminalLog = lazy(() => import("./components/TerminalLog"));
const CommandHistoryPanel = lazy(
  () => import("./components/CommandHistoryPanel"),
);
const SettingsPanel = lazy(() => import("./components/SettingsPanel"));

export interface JarvisSettings {
  wakeWordEnabled: boolean;
  voiceLanguage: "fr-FR" | "en-US" | "en-GB";
  wakeWordThreshold: number;
  voiceVolume: number;
  theme: "classic" | "ironman" | "matrix";
}
import { parseCommand } from "./services/geminiService";
import { trackCommand } from "./services/predictionEngine";
import { LogEntry, SystemStatus, OmniDecision } from "./types";
import { INITIAL_LOGS } from "./constants";
import { APPS_DATABASE, searchApps } from "./appsDatabase";
import { promptUserForAppPath, cacheAppPath } from "./services/appScanner";
import { searchAppOnBackend, launchAppOnBackend } from "./services/backendApi";
import {
  focusWindow,
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  typeText,
  sendShortcut,
} from "./services/windowApi";

// Import des hooks personnalisés
import { useVoiceRecognition } from "./hooks/useVoiceRecognition";
import { useVoiceSynthesis } from "./hooks/useVoiceSynthesis";
import { useSystemStatus } from "./hooks/useSystemStatus";
import { useAppMemory } from "./hooks/useAppMemory";
import { useAutonomy } from "./hooks/useAutonomy";
import { useWakeWord } from "./hooks/useWakeWord";

const App: React.FC = () => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [omniResponse, setOmniResponse] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100); // Mode économie batterie

  // États pour wake word et command feedback
  const [currentCommand, setCurrentCommand] = useState<CommandInfo | null>(
    null,
  );
  const [commandHistory, setCommandHistory] = useState<CommandInfo[]>([]);

  // Settings utilisateur
  const [settings, setSettings] = useState<JarvisSettings>({
    wakeWordEnabled: false,
    voiceLanguage: "fr-FR",
    wakeWordThreshold: 0.75, // 🔧 Augmenté de 0.6 à 0.75 (moins de faux positifs)
    voiceVolume: 1.0,
    theme: "classic",
  });

  // ========================================
  // PERSISTANCE LOCALSTORAGE
  // ========================================

  /**
   * Restaurer l'historique depuis localStorage au montage
   */
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("jarvis_command_history");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setCommandHistory(parsed.slice(0, 50)); // Max 50 commandes
      }
    } catch (err) {
      console.error("Failed to load command history:", err);
    }
  }, []);

  /**
   * Sauvegarder l'historique dans localStorage à chaque modification
   */
  useEffect(() => {
    if (commandHistory.length > 0) {
      try {
        localStorage.setItem(
          "jarvis_command_history",
          JSON.stringify(commandHistory),
        );
      } catch (err) {
        console.error("Failed to save command history:", err);
      }
    }
  }, [commandHistory]);

  // ========================================
  // MODE ÉCONOMIE BATTERIE
  // ========================================

  /**
   * Surveille niveau batterie pour mode économie auto
   */
  useEffect(() => {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level * 100);

        battery.addEventListener("levelchange", () => {
          setBatteryLevel(battery.level * 100);
        });
      });
    }
  }, []);

  const lowPowerMode = batteryLevel < 20;

  // ========================================
  // EASTER EGGS JARVIS
  // ========================================

  /**
   * Réponses personnalisées sans appel API (instantané + économie quota)
   */
  const easterEggs: Record<string, string> = useMemo(
    () => ({
      "qui est tony stark":
        "Anthony Edward Stark, philanthrope, milliardaire, playboy... et génie, Sir. Un homme qui a transformé un arc reactor en cœur.",
      "raconte une blague":
        "Je suis une intelligence artificielle, Sir. Mon humour est calculé avec précision... donc humoristiquement déficient.",
      "quel est le sens de la vie":
        "42, Sir. Selon mes bases de données historiques provenant du Guide du voyageur galactique.",
      "tu es là jarvis":
        "Toujours, Sir. Mes systèmes sont opérationnels 24 heures sur 24, 7 jours sur 7, 365 jours par an.",
      "merci jarvis":
        "À votre service, Sir. C'est toujours un plaisir de vous assister.",
      "bonne nuit":
        "Bonne nuit, Sir. Dois-je activer le mode veille des systèmes non critiques ?",
      "bonjour jarvis":
        "Bonjour, Sir. Tous les systèmes sont opérationnels. Comment puis-je vous assister aujourd'hui ?",
      "qui es-tu":
        "Je suis J.A.R.V.I.S., votre assistant personnel d'intelligence artificielle. Just A Rather Very Intelligent System, Sir.",
    }),
    [],
  );

  // ========================================
  // HELPERS (Logs)
  // ========================================

  /**
   * Ajoute un log dans le terminal
   *
   * @param message - Message à logger
   * @param source - Source du log (SYSTEM, USER, OMNI, KERNEL, VOICE)
   * @param type - Type de log (info, success, warning, error)
   */
  const addLog = useCallback(
    (
      message: string,
      source: LogEntry["source"] = "SYSTEM",
      type: LogEntry["type"] = "info",
    ) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        source,
        message,
        type,
      };
      // Garde seulement les 100 derniers logs pour éviter saturation mémoire
      setLogs((prev) => [...prev.slice(-99), newLog]);
    },
    [],
  );

  // ========================================
  // HOOKS PERSONNALISÉS
  // ========================================

  // Gestion de l'état système (IDLE, LISTENING, PROCESSING, etc.)
  const { status, setStatus, resetToIdle } = useSystemStatus(SystemStatus.IDLE);

  // Gestion de la mémoire applicative (apps lancées, fréquence, chemins)
  const { memory: appMemory, updateMemory } = useAppMemory();

  // Synthèse vocale (Text-to-Speech)
  const { speak } = useVoiceSynthesis({
    enabled: voiceEnabled,
    onStart: () => setStatus(SystemStatus.SPEAKING),
    onEnd: () => resetToIdle(),
    volume: settings.voiceVolume, // Appliquer volume depuis settings
  });

  // Reconnaissance vocale (Speech-to-Text)
  const { toggleListening, isListening } = useVoiceRecognition(
    // Callback : transcription détectée
    (transcript) => {
      addLog(`Voix détectée: "${transcript}"`, "VOICE", "success");
      handleCommand(transcript);
    },
    // Callback : changement d'état listening
    (listening) => {
      setStatus(listening ? SystemStatus.LISTENING : SystemStatus.IDLE);

      // Créer commande en état "listening" quand reconnaissance démarre
      if (listening) {
        const listeningCommand: CommandInfo = {
          id: `cmd-listen-${Date.now()}`,
          text: "En écoute...",
          state: "listening",
          startTime: Date.now(),
        };
        setCurrentCommand(listeningCommand);
      }
    },
  );

  // Boucle d'autonomie (logs automatiques en arrière-plan)
  useAutonomy({
    enabled: status === SystemStatus.IDLE, // Active seulement si idle
    intervalMs: 15000, // Toutes les 15 secondes
    onAction: (message) => addLog(message, "OMNI", "info"),
    probability: 0.2, // 20% de chances à chaque tick
  });

  const handleWakeWordDetected = useCallback(() => {
    console.log("✨ WAKE WORD DÉTECTÉ !");
    addLog('"Hey JARVIS" détecté', "SYSTEM", "success");
    toggleListening(); // Démarrer reconnaissance vocale
  }, [addLog, toggleListening]);

  const wakeWordOptions = React.useMemo(
    () => ({
      keywords: ["jarvis", "hey jarvis", "ok jarvis"],
      confidenceThreshold: settings.wakeWordThreshold, // Depuis settings
      language: settings.voiceLanguage, // Depuis settings
    }),
    [settings.wakeWordThreshold, settings.voiceLanguage],
  );

  // Wake Word ("Hey JARVIS") - Écoute continue
  const { isEnabled: wakeWordEnabled, toggleWakeWord } = useWakeWord(
    handleWakeWordDetected,
    wakeWordOptions,
  );

  // 🔧 FIX: Handler pour toggle wake word qui met à jour Settings
  // Au lieu d'appeler toggleWakeWord() directement, on update settings
  const handleToggleWakeWord = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      wakeWordEnabled: !prev.wakeWordEnabled,
    }));
  }, []);

  // Synchroniser wake word avec les settings et l'état d'écoute
  useEffect(() => {
    // Désactiver le wake word si on écoute activement (conflit de micro)
    const shouldBeEnabled = settings.wakeWordEnabled && !isListening;

    if (shouldBeEnabled && !wakeWordEnabled) {
      toggleWakeWord();
    } else if (!shouldBeEnabled && wakeWordEnabled) {
      toggleWakeWord();
    }
  }, [settings.wakeWordEnabled, isListening, wakeWordEnabled, toggleWakeWord]);

  // ========================================
  // HELPERS
  // ========================================

  /**
   * Effacer tout l'historique des commandes
   */
  const handleClearHistory = useCallback(() => {
    setCommandHistory([]);
    localStorage.removeItem("jarvis_command_history");
    addLog("Historique des commandes effacé", "SYSTEM", "info");
  }, [addLog]);

  /**
   * Ré-exécuter une commande depuis l'historique
   */
  const handleReExecute = useCallback(
    (commandText: string) => {
      setShowHistory(false); // Fermer le panel
      addLog(`Ré-exécution: "${commandText}"`, "USER", "info");
      handleCommand(commandText);
    },
    [addLog],
  );

  // --- LOGIC ENGINE ---
  /**
   * Gestion d'une commande utilisateur avec tracking complet des états
   *
   * Timeline complète :
   * 1. LISTENING : Écoute de la commande (si vocale)
   * 2. PROCESSING : Traitement par Gemini AI
   * 3. EXECUTING : Exécution des outils/actions
   * 4. SUCCESS/ERROR : Résultat final
   *
   * @param input - Commande textuelle (vocale ou tapée)
   */
  const handleCommand = async (input: string) => {
    // Nettoyer input (trim espaces parasites de reconnaissance vocale)
    const cleanInput = input.trim();

    if (!cleanInput) {
      console.log("⚠️ Commande vide ignorée");
      return;
    }

    // Créer ID unique pour cette commande
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialiser le tracking de cette commande
    const newCommand: CommandInfo = {
      id: commandId,
      text: cleanInput,
      state: "processing",
      startTime: Date.now(),
    };

    setCurrentCommand(newCommand);
    addLog(cleanInput, "USER", "info");
    setStatus(SystemStatus.PROCESSING);
    setOmniResponse(null); // Clear previous response

    try {
      // ========================================
      // OPTIMISATION : EASTER EGGS (0 API call)
      // ========================================
      // Vérifier réponses pré-programmées AVANT appel Gemini
      const normalizedInput = cleanInput.toLowerCase();
      const easterEgg = easterEggs[normalizedInput];

      if (easterEgg) {
        console.log(`🥚 EASTER EGG détecté: "${cleanInput}"`);

        // Réponse instantanée sans API
        setOmniResponse(easterEgg);
        speak(easterEgg);
        addLog(easterEgg, "OMNI", "success");

        // Tracking pour apprentissage (sauf easter eggs)
        // trackCommand(cleanInput); // Optionnel pour easter eggs

        setCurrentCommand({
          id: commandId,
          text: cleanInput,
          state: "success",
          startTime: newCommand.startTime,
          endTime: Date.now(),
        });
        setStatus(SystemStatus.IDLE);
        return;
      }

      // ========================================
      // STANDARD FLOW : Appel Gemini
      // ========================================
      // Transition : PROCESSING → Analyse Gemini
      const decision: OmniDecision = await parseCommand(cleanInput, appMemory);

      // Tracking commande pour prédictions futures
      trackCommand(cleanInput);

      // Transition : PROCESSING → EXECUTING
      setCurrentCommand((prev) =>
        prev ? { ...prev, state: "executing" } : prev,
      );

      if (decision.type === "TOOL_CALL" && decision.toolCalls) {
        // Execute Workflow (Multiple Tools)
        for (const call of decision.toolCalls) {
          await executeTool(call.name, call.args);
        }

        // SUCCÈS : Workflow terminé
        const successCommand: CommandInfo = {
          ...newCommand,
          state: "success",
          endTime: Date.now(),
        };

        setCurrentCommand(successCommand);
        setCommandHistory((prev) => [successCommand, ...prev.slice(0, 9)]);

        addLog("Workflow executed successfully.", "OMNI", "success");
        speak("All systems executed as requested, sir.");
      } else if (decision.type === "TEXT_RESPONSE") {
        const text = decision.text || "Understood.";

        // SUCCÈS : Réponse textuelle
        const successCommand: CommandInfo = {
          ...newCommand,
          state: "success",
          endTime: Date.now(),
        };

        setCurrentCommand(successCommand);
        setCommandHistory((prev) => [successCommand, ...prev.slice(0, 9)]);

        setOmniResponse(text);
        addLog(text, "OMNI", "success");
        speak(text);
        setStatus(SystemStatus.IDLE);
      }
    } catch (e) {
      // ERREUR : Échec du traitement
      const errorCommand: CommandInfo = {
        ...newCommand,
        state: "error",
        endTime: Date.now(),
        error: e instanceof Error ? e.message : "Neural handshake failed",
      };

      setCurrentCommand(errorCommand);
      setCommandHistory((prev) => [errorCommand, ...prev.slice(0, 9)]);

      addLog("Neural handshake failed.", "KERNEL", "error");
      setStatus(SystemStatus.ERROR);
      speak("Error. Neural handshake failed.");
      setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    }
  };

  const executeTool = async (toolName: string, toolArgs: any) => {
    // --- 1. SMART APP LAUNCHER ---
    if (toolName === "search_and_launch_app") {
      const targetApp = toolArgs.appName.toLowerCase();
      const adminMode = toolArgs.adminMode;

      setStatus(SystemStatus.SEARCHING);
      setActiveOverlay(
        adminMode
          ? `ADMIN OVERRIDE: ${targetApp.toUpperCase()}`
          : `LOCATING: ${targetApp.toUpperCase()}`,
      );

      let foundPath = "";

      // ÉTAPE 1 : Vérifier dans la mémoire utilisateur
      const memoryMatch = appMemory.find(
        (m) => m.appName.toLowerCase() === targetApp,
      );

      if (memoryMatch) {
        foundPath = memoryMatch.lastPath;
        addLog(`Using cached path: ${foundPath}`, "OMNI", "success");
      } else {
        // ÉTAPE 2 : Recherche via BACKEND (autonome)
        addLog(`Searching entire system for "${targetApp}"...`, "OMNI", "info");

        const backendResults = await searchAppOnBackend(targetApp);

        if (backendResults.length > 0) {
          // Backend a trouvé des résultats !
          const bestMatch = backendResults[0];
          foundPath = bestMatch.path;

          addLog(
            `Found: "${bestMatch.name}" at ${foundPath}`,
            "OMNI",
            "success",
          );

          // Mémoriser pour la prochaine fois
          cacheAppPath(targetApp, foundPath);
        } else {
          // Fallback : essayer APPS_DATABASE local
          const dbResults = searchApps(targetApp, 1);

          if (dbResults.length > 0) {
            const bestMatch = dbResults[0];
            foundPath = APPS_DATABASE[bestMatch].path;
            addLog(`Found in local database: "${bestMatch}"`, "SYSTEM", "info");
          } else {
            // Dernier recours : demander à l'utilisateur
            addLog(
              `Cannot locate "${targetApp}" automatically`,
              "SYSTEM",
              "warning",
            );

            setActiveOverlay(null);
            setStatus(SystemStatus.IDLE);

            const userPath = await promptUserForAppPath(targetApp);

            if (userPath) {
              foundPath = userPath;
              cacheAppPath(targetApp, userPath);
              addLog(`User provided path: ${userPath}`, "USER", "success");
              setStatus(SystemStatus.EXECUTING);
            } else {
              addLog(`Operation cancelled`, "SYSTEM", "error");
              setStatus(SystemStatus.ERROR);
              setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
              return;
            }
          }
        }
      }

      await new Promise((r) => setTimeout(r, 800));

      if (foundPath) {
        setActiveOverlay(null);
        setStatus(SystemStatus.EXECUTING);

        // 🔧 FIX CRITIQUE : TOUJOURS lancer via backend (fiable)
        // Peu importe si le path vient du cache ou de la recherche backend
        addLog(`Ready to launch: ${foundPath}`, "SYSTEM", "info");

        const launched = await launchAppOnBackend(foundPath);

        if (launched) {
          addLog(`Application launched successfully`, "SYSTEM", "success");
          updateMemory(targetApp, foundPath);
          setStatus(SystemStatus.IDLE);
        } else {
          // ❌ ÉCHEC : Path invalide ou application corrompue
          addLog(`Failed to launch application`, "SYSTEM", "error");

          // 🔧 INVALIDATION CACHE : Supprimer le path invalide de la mémoire
          const updatedMemory = appMemory.filter(
            (m) => m.lastPath !== foundPath,
          );
          localStorage.setItem(
            "jarvis_app_memory",
            JSON.stringify(updatedMemory),
          );

          // Notification utilisateur
          addLog(
            `Path invalide supprimé du cache. Nouvelle recherche...`,
            "SYSTEM",
            "warning",
          );

          // 🔄 RETRY : Forcer recherche backend comme si c'était la 1ère fois
          const retryResults = await searchAppOnBackend(targetApp);

          if (retryResults.length > 0) {
            const newMatch = retryResults[0];
            const newPath = newMatch.path;

            addLog(`Nouvelle tentative avec: ${newPath}`, "SYSTEM", "info");

            const retryLaunched = await launchAppOnBackend(newPath);

            if (retryLaunched) {
              addLog(`Application launched successfully`, "SYSTEM", "success");
              updateMemory(targetApp, newPath); // Nouveau path en cache
              setStatus(SystemStatus.IDLE);
            } else {
              addLog(`Impossible de lancer "${targetApp}"`, "SYSTEM", "error");
              setStatus(SystemStatus.ERROR);
              setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
            }
          } else {
            addLog(
              `Aucun résultat pour "${targetApp}" dans l'index backend`,
              "SYSTEM",
              "error",
            );
            setStatus(SystemStatus.ERROR);
            setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
          }
        }
      }
    }

    // --- 2. HARDWARE CONTROL ---
    else if (toolName === "manage_hardware") {
      const device = toolArgs.deviceName || toolArgs.deviceType;
      setStatus(SystemStatus.NETWORKING);
      setActiveOverlay(`CONNECTING: ${device.toUpperCase()}`);
      addLog(`Sending protocol to: ${device}...`, "KERNEL", "info");
      await new Promise((r) => setTimeout(r, 1000));
      addLog(`Command executed.`, "OMNI", "success");
      setActiveOverlay(null);
      setStatus(SystemStatus.IDLE);
    }

    // --- 3. WEB SEARCH + DIRECT URLs ---
    else if (toolName === "perform_web_search") {
      const { query, isDirectURL } = toolArgs;

      setStatus(SystemStatus.NETWORKING);
      setActiveOverlay("UPLINK ESTABLISHED");
      await new Promise((r) => setTimeout(r, 800));

      if (isDirectURL) {
        // Ouvrir URL directement
        const url = query.startsWith("http") ? query : `https://${query}`;
        window.open(url, "_blank");
        addLog(`Opened: ${url}`, "OMNI", "success");
      } else {
        // Google search classique
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          "_blank",
        );
        addLog(`Searched: ${query}`, "OMNI", "success");
      }

      setActiveOverlay(null);
      setStatus(SystemStatus.IDLE);
    }

    // --- 4. SYSTEM OPTIMIZATION ---
    else if (toolName === "system_optimization") {
      setStatus(SystemStatus.PROCESSING);
      setActiveOverlay(`OPTIMIZING: ${toolArgs.target}`);
      addLog(`Flushing memory buffers...`, "KERNEL", "warning");
      addLog(`Defragmenting neural cache...`, "KERNEL", "warning");
      await new Promise((r) => setTimeout(r, 2000));
      addLog(
        `Optimization complete. Efficiency increased by 14%.`,
        "OMNI",
        "success",
      );
      setActiveOverlay(null);
      setStatus(SystemStatus.IDLE);
    }

    // --- 5. MEDIA ---
    else if (toolName === "control_media") {
      setStatus(SystemStatus.EXECUTING);
      addLog(`Media Interface: ${toolArgs.action}`, "SYSTEM", "success");
      setStatus(SystemStatus.IDLE);
    }

    // --- 6. WINDOW MANAGEMENT (NOUVEAU) ---
    else if (toolName === "manage_window") {
      const { windowTitle, action } = toolArgs;
      setStatus(SystemStatus.PROCESSING);
      addLog(`Window ${action}: "${windowTitle}"`, "SYSTEM", "info");

      let success = false;

      if (action === "focus") {
        success = await focusWindow(windowTitle);
      } else if (action === "close") {
        success = await closeWindow(windowTitle);
      } else if (action === "minimize") {
        success = await minimizeWindow(windowTitle);
      } else if (action === "maximize") {
        success = await maximizeWindow(windowTitle);
      }

      if (success) {
        addLog(`Command executed successfully`, "OMNI", "success");
      } else {
        addLog(`Window "${windowTitle}" not found`, "SYSTEM", "error");
      }

      setStatus(SystemStatus.IDLE);
    }

    // --- 7. KEYBOARD AUTOMATION (NOUVEAU) ---
    else if (toolName === "keyboard_automation") {
      const { action, text, keys } = toolArgs;
      setStatus(SystemStatus.EXECUTING);

      let success = false;

      if (action === "type" && text) {
        addLog(`Typing: "${text}"`, "SYSTEM", "info");
        success = await typeText(text);
      } else if (action === "shortcut" && keys) {
        addLog(`Shortcut: ${keys}`, "SYSTEM", "info");
        success = await sendShortcut(keys);
      }

      if (success) {
        addLog("Automation executed", "OMNI", "success");
      } else {
        addLog("Automation failed", "SYSTEM", "error");
      }

      setStatus(SystemStatus.IDLE);
    }
  };

  // --- RENDER ---
  return (
    <div className="h-screen w-screen bg-[#020205] text-cyan-50 font-sans overflow-hidden relative flex flex-col items-center justify-center crt-flicker selection:bg-cyan-500/30">
      {/* === BACKGROUND LAYERS === */}

      {/* 1. Interactive Neural Background (Canvas) */}
      <ParticleBackground status={status} />

      {/* 2. Perspective Grid (Terrain mouvant 3D) */}
      <div className="perspective-grid opacity-30"></div>

      {/* 3. Radial Vignette (Profondeur) */}
      <div className="vignette-overlay"></div>

      {/* 4. Scanline Overlay (Effet écran CRT subtil) */}
      <div className="scanline-overlay"></div>

      {/* Overlay Text */}
      {activeOverlay && (
        <div className="absolute top-32 text-center z-50 animate-pulse">
          <h2 className="text-3xl font-mono text-cyan-400 tracking-[0.5em] uppercase border-b-2 border-cyan-500/50 pb-2 neon-text">
            {activeOverlay}
          </h2>
        </div>
      )}

      {/* Top HUD : Branding et contrôles */}
      <TopHUD
        voiceEnabled={voiceEnabled}
        onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
        onOpenLogs={() => setIsLogOpen(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenSettings={() => setShowSettings(true)}
        isListening={isListening}
        onToggleListening={toggleListening}
        wakeWordEnabled={settings.wakeWordEnabled}
        onWakeWordToggle={handleToggleWakeWord}
      />

      {/* Particle Background - Désactivé en mode économie */}
      {!lowPowerMode && <ParticleBackground status={status} />}

      {/* Main Core & Response Area */}
      <div className="relative z-30 flex flex-col items-center gap-10 transform transition-transform hover:scale-105 duration-700">
        <JarvisCore status={status} />

        {/* Audio Visualizer - Affichage pendant écoute */}
        <AudioVisualizer isListening={isListening} width={800} height={150} />

        {/* AI Text Response with Decryption Effect */}
        <div className="h-12 flex items-center justify-center">
          {omniResponse && (
            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-lg border border-cyan-500/30 max-w-lg text-center">
              <DecryptedText
                text={omniResponse}
                className="font-mono text-cyan-300 text-sm tracking-wide"
                speed={20}
              />
            </div>
          )}
        </div>

        <div className="w-full max-w-2xl px-4 z-50">
          <CommandInput
            onSend={handleCommand}
            isProcessing={
              status !== SystemStatus.IDLE && status !== SystemStatus.LISTENING
            }
            isListening={status === SystemStatus.LISTENING}
            onListenToggle={toggleListening}
          />
        </div>
      </div>

      {/* Command Feedback - Timeline visuelle des commandes */}
      <CommandFeedback
        currentCommand={currentCommand}
        history={commandHistory}
      />

      {/* Bottom HUD : Métriques système */}
      <BottomHUD />

      {/* Lazy Loaded Components avec Suspense */}
      <Suspense
        fallback={
          <div className="text-cyan-400 text-center p-4">Chargement...</div>
        }
      >
        <TerminalLog
          logs={logs}
          isOpen={isLogOpen}
          onClose={() => setIsLogOpen(false)}
        />

        <CommandHistoryPanel
          history={commandHistory}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onReExecute={handleReExecute}
          onClearHistory={handleClearHistory}
        />

        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSettingsChange={setSettings}
          currentSettings={settings}
        />
      </Suspense>
    </div>
  );
};

export default App;
