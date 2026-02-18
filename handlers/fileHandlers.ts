/**
 * File Handlers - Create, Delete, Move, Copy, Search, READ, WRITE
 */

import { HandlerContext } from "../types/app.types";

// ============================================================================
// AGENT DE CODE (Windsurf Mode)
// ============================================================================

/**
 * Lire le contenu d'un fichier (SÉCURISÉ)
 */
export const handleReadFile = async (
  args: { path: string },
  ctx: HandlerContext,
) => {
  const { path } = args;
  const { addLog } = ctx;

  addLog(`📖 Reading file: ${path}`, "KERNEL", "info");

  try {
    const response = await fetch(
      "http://localhost:3001/api/files/secure-read",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      },
    );

    const data = await response.json();

    if (data.success) {
      return {
        status: "success",
        data: data.content,
        message: `Fichier lu avec succès (${data.content.length} caractères).`,
      };
    } else {
      throw new Error(data.error || "Erreur inconnue");
    }
  } catch (error) {
    addLog(`❌ Read error: ${error}`, "KERNEL", "error");
    return {
      status: "error",
      message: `Impossible de lire le fichier : ${error}`,
    };
  }
};

/**
 * Écrire dans un fichier (SÉCURISÉ)
 */
export const handleWriteFile = async (
  args: { path: string; content: string },
  ctx: HandlerContext,
) => {
  const { path, content } = args;
  const { addLog } = ctx;

  addLog(`✍️ Writing to file: ${path}`, "KERNEL", "warning");

  try {
    const response = await fetch(
      "http://localhost:3001/api/files/secure-write",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      },
    );

    const data = await response.json();

    if (data.success) {
      addLog(`✅ File written: ${path}`, "KERNEL", "success");
      return {
        status: "success",
        message: "Fichier écrit avec succès (Backup créé).",
      };
    } else {
      throw new Error(data.error || "Erreur inconnue");
    }
  } catch (error) {
    addLog(`❌ Write error: ${error}`, "KERNEL", "error");
    return {
      status: "error",
      message: `Impossible d'écrire le fichier : ${error}`,
    };
  }
};

// ============================================================================
// GESTION FICHIERS CLASSIQUE (Existants)
// ============================================================================

// Interface générique pour les arguments fichiers
interface FileActionArgs {
  path: string;
  content?: string;
  [key: string]: unknown;
}

export const handleCreateFile = async (
  args: FileActionArgs,
  ctx: HandlerContext,
) => {
  // Redirige vers write pour simplifier, ou implémenter via API legacy
  return handleWriteFile({ path: args.path, content: args.content || "" }, ctx);
};

export const handleDeleteFile = async (
  args: { path: string },
  ctx: HandlerContext,
) => {
  const { path } = args;
  const { addLog } = ctx;
  addLog(`🗑️ Deleting file: ${path}`, "KERNEL", "warning");

  try {
    const response = await fetch("http://localhost:3001/api/files/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", path }),
    });

    const data = await response.json();

    if (data.success) {
      return {
        status: "success",
        message: "Fichier supprimé avec succès.",
      };
    } else {
      throw new Error(data.error || "Erreur lors de la suppression");
    }
  } catch (error) {
    addLog(`❌ Delete error: ${error}`, "KERNEL", "error");
    return {
      status: "error",
      message: `Impossible de supprimer le fichier : ${error}`,
    };
  }
};

export const handleMoveFile = async (
  _args: Record<string, unknown>,
  _ctx: HandlerContext,
) => {
  return { status: "warning", message: "Non implémenté" };
};
export const handleCopyFile = async (
  _args: Record<string, unknown>,
  _ctx: HandlerContext,
) => {
  return { status: "warning", message: "Non implémenté" };
};
export const handleSearchFiles = async (
  _args: Record<string, unknown>,
  _ctx: HandlerContext,
) => {
  return {
    status: "warning",
    message: "Utilisez 'consult_memory' pour la recherche.",
  };
};
export const handleOrganizeFiles = async (
  _args: Record<string, unknown>,
  _ctx: HandlerContext,
) => {
  return { status: "warning", message: "Non implémenté" };
};
