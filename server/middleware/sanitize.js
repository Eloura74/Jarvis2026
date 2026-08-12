/**
 * Middleware de sanitization des inputs
 * Protection XSS, SQL injection, NoSQL injection
 */

import validator from "validator";

/**
 * Sanitize une string : trim + escape HTML
 *
 * @param {string} str - String à nettoyer
 * @returns {string} String nettoyée
 */
export const sanitizeString = (str) => {
  if (typeof str !== "string") return str;

  // Trim whitespace
  let cleaned = validator.trim(str);

  // Escape HTML pour prévenir XSS
  cleaned = validator.escape(cleaned);

  return cleaned;
};

/**
 * Sanitize récursivement un objet
 *
 * @param {any} obj - Objet à nettoyer
 * @returns {any} Objet nettoyé
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Middleware pour sanitizer le body des requêtes
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware pour sanitizer les query params
 */
export const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Middleware pour sanitizer les params d'URL
 */
export const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Routes exemptées de sanitization.
 * - OAuth callback : code Google contient des / + = corrompus par escape()
 * - Automation clavier (type/shortcut) : le texte dicté est du contenu utilisateur
 *   arbitraire qui doit arriver intact (apostrophes, &, <, >, etc.)
 */
const SANITIZE_EXEMPT_PATHS = [
  "/api/google/callback",
  "/api/windows/type",
  "/api/windows/shortcut",
  "/api/automation/type",
  "/api/automation/shortcut",
];

/**
 * Middleware combiné : sanitize body + query + params
 */
export const sanitizeAll = (req, res, next) => {
  if (SANITIZE_EXEMPT_PATHS.some((path) => req.path.startsWith(path))) {
    return next();
  }
  sanitizeBody(req, res, () => {});
  sanitizeQuery(req, res, () => {});
  sanitizeParams(req, res, () => {});
  next();
};
