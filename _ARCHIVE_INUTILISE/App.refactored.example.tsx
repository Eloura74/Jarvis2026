/**
 * EXEMPLE App.tsx REFACTORÉ
 *
 * Montre comment utiliser les handlers modulaires
 * pour réduire App.tsx de 1020 → 250 lignes
 */

import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import { PremiumLayout } from "./components/PremiumLayout";
import { LogEntry, SystemStatus } from "./types";
import { HandlerContext } from "./types/app.types";
import { toasterConfig } from "./utils/toasterConfig";
import * as handlers from "./handlers";

const AppRefactored: React.FC = () => {
  // ========================================
  // ÉTATS
  // ========================================

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState(SystemStatus.IDLE);
  const [isListening, setIsListening] = useState(false);
  const [commandCount, setCommandCount] = useState(0);
  const [successTrigger, setSuccessTrigger] = useState(0);

  // ========================================
  // HELPERS
  // ========================================

  const addLog = (
    message: string,
    source: string,
    type: "info" | "success" | "error" | "warning",
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        source,
        message,
        type,
        timestamp: Date.now(),
      },
    ]);
  };

  // ========================================
  // TOOL EXECUTOR (389 lignes → 50 lignes!)
  // ========================================

  const executeTool = async (toolName: string, toolArgs: any) => {
    // Contexte commun passé à tous les handlers
    const ctx: HandlerContext = { addLog, setStatus };

    // Dépendances additionnelles (si besoin)
    const deps = {
      setActiveOverlay: (text: string | null) => {}, // Simplifier si PremiumLayout
      appMemory: [],
      updateMemory: (app: string, path: string) => {},
    };

    // Router simple - 1 ligne par tool au lieu de 20-50 lignes!
    switch (toolName) {
      // System
      case "search_and_launch_app":
        return handlers.handleSearchAndLaunchApp(toolArgs, ctx, deps);
      case "manage_window":
        return handlers.handleManageWindow(toolArgs, ctx);
      case "keyboard_automation":
        return handlers.handleKeyboardAutomation(toolArgs, ctx);

      // Files
      case "create_file":
        return handlers.handleCreateFile(toolArgs, ctx);
      case "delete_file":
        return handlers.handleDeleteFile(toolArgs, ctx);
      case "move_file":
        return handlers.handleMoveFile(toolArgs, ctx);
      case "copy_file":
        return handlers.handleCopyFile(toolArgs, ctx);
      case "search_files":
        return handlers.handleSearchFiles(toolArgs, ctx);
      case "organize_files":
        return handlers.handleOrganizeFiles(toolArgs, ctx);

      // Session
      case "lock_session":
        return handlers.handleLockSession(toolArgs, ctx);
      case "shutdown_system":
        return handlers.handleShutdownSystem(toolArgs, ctx);
      case "restart_system":
        return handlers.handleRestartSystem(toolArgs, ctx);
      case "sleep_system":
        return handlers.handleSleepSystem(toolArgs, ctx);

      // Media
      case "adjust_volume":
        return handlers.handleAdjustVolume(toolArgs, ctx);
      case "control_media":
        return handlers.handleControlMedia(toolArgs, ctx);
      case "take_screenshot":
        return handlers.handleTakeScreenshot(toolArgs, ctx);

      // Web
      case "search_web":
        return handlers.handleSearchWeb(toolArgs, ctx);
      case "open_url":
        return handlers.handleOpenUrl(toolArgs, ctx);
      case "manage_bookmarks":
        return handlers.handleManageBookmarks(toolArgs, ctx);

      // Productivity
      case "set_timer":
        return handlers.handleSetTimer(toolArgs, ctx);
      case "manage_notes":
        return handlers.handleManageNotes(toolArgs, ctx);
      case "manage_todos":
        return handlers.handleManageTodos(toolArgs, ctx);
      case "set_reminder":
        return handlers.handleSetReminder(toolArgs, ctx);

      default:
        addLog(`Unknown tool: ${toolName}`, "SYSTEM", "error");
    }
  };

  // ========================================
  // COMMAND HANDLER
  // ========================================

  const handleCommand = async (command: string) => {
    setCommandCount((prev) => prev + 1);
    addLog(command, "USER", "info");

    // TODO: Appeler Gemini parseCommand + executeTool
    // const decision = await parseCommand(command);
    // if (decision.tools) {
    //   for (const tool of decision.tools) {
    //     await executeTool(tool.name, tool.args);
    //   }
    // }

    // Simuler succès
    setTimeout(() => {
      addLog("Command executed", "SYSTEM", "success");
      setSuccessTrigger(Date.now());
    }, 1000);
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <PremiumLayout
        status={status as any}
        commandCount={commandCount}
        cpuUsage={23}
        memoryUsage="4.2 GB"
        onCommand={handleCommand}
        onMicrophoneClick={() => setIsListening(!isListening)}
        isListening={isListening}
        logs={logs}
        isProcessing={status === SystemStatus.PROCESSING}
        processingMessage="Processing..."
        successTrigger={successTrigger}
      />

      <Toaster {...toasterConfig} />
    </>
  );
};

export default AppRefactored;
