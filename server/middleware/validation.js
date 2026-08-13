/**
 * Middleware de validation des inputs avec Zod
 * Protection contre injections et données malformées
 */

import { z } from "zod";

/**
 * Schémas de validation Zod pour les routes
 */
export const schemas = {
  // Routes fenêtres — l'action est encodée dans l'URL (ex: POST /close)
  // On accepte windowTitle OU appName, les deux sont optionnels pour
  // permettre un body vide (ex: fermer la fenêtre active)
  windowAction: z.object({
    windowTitle: z.string().min(1).max(200).optional(),
    appName: z.string().min(1).max(200).optional(),
    title: z.string().min(1).max(200).optional(),
  }),

  // Routes web
  openUrl: z.object({
    url: z.string().url().max(2000),
  }),

  searchWeb: z.object({
    query: z.string().min(1).max(500),
    engine: z.enum(["google", "bing", "duckduckgo"]).optional(),
  }),

  // Routes apps
  launchApp: z.object({
    appName: z.string().min(1).max(100),
  }),

  // Routes automation
  // text est optionnel : on peut focus une app sans taper (focusApp seul)
  typeText: z.object({
    text: z.string().max(10000).optional(),
    focusApp: z.string().max(200).optional(),
  }).refine(
    (data) => data.text !== undefined || data.focusApp !== undefined,
    { message: "Au moins 'text' ou 'focusApp' doit être fourni" }
  ),

  sendShortcut: z.object({
    keys: z.string().min(1).max(50),
    shortcut: z.string().min(1).max(50).optional(), // alias utilisé par certains tools
  }),
};

/**
 * Middleware factory pour valider le body d'une requête
 *
 * @param {z.ZodSchema} schema - Schéma Zod à utiliser
 * @returns {Function} Middleware Express
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Remplacer par données validées
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory pour valider les query params
 *
 * @param {z.ZodSchema} schema - Schéma Zod à utiliser
 * @returns {Function} Middleware Express
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};
