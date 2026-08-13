/**
 * Middleware de rate limiting
 * Protection contre abus et attaques DDoS
 */

import rateLimit from "express-rate-limit";

/**
 * Rate limiter général pour toutes les routes API
 * 100 requêtes par 15 minutes par IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // 10000 requêtes max (suffisant pour polling local)
  message: {
    error: "Too many requests",
    message: "Please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // Ignorer le rate-limiting pour localhost et les routes de polling
  skip: (req) => {
    const ip = req.ip || req.socket?.remoteAddress;
    if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || req.hostname === "localhost") {
      return true; // Ne jamais bloquer les requêtes locales
    }
    const exemptedPaths = [
      "/api/sphere",
      "/api/system",
      "/api/presence",
      "/api/status",
      "/api/config",
      "/api/events",
      "/api/states",
      "/api/workflows",
      "/api/weather",
    ];
    return exemptedPaths.some((path) => req.path.startsWith(path));
  },
});

/**
 * Rate limiter strict pour routes sensibles
 * 10 requêtes par minute par IP
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requêtes max
  message: {
    error: "Rate limit exceeded",
    message: "This endpoint is rate-limited. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour authentification/login
 * 5 tentatives par 15 minutes par IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: {
    error: "Too many authentication attempts",
    message: "Please try again in 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne compter que les échecs
});

/**
 * Rate limiter pour recherches/queries
 * 30 requêtes par minute par IP
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requêtes max
  message: {
    error: "Search rate limit exceeded",
    message: "Too many searches. Please wait a moment.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
