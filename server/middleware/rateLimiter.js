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
  max: 100, // 100 requêtes max
  message: {
    error: "Too many requests",
    message: "Please try again in 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests (only count errors)
  skipSuccessfulRequests: false,
  // Exempter les routes appelées très fréquemment par le frontend
  skip: (req) => {
    const exemptedPaths = [
      "/api/sphere/state",
      "/api/sphere/mode",
      "/api/sphere/text",
      "/api/system/stats/light",
      "/api/system/stats",
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
