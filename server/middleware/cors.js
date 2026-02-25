/**
 * Configuration CORS stricte
 * Sécurité contre attaques cross-origin
 */

import cors from "cors";

/**
 * Liste des origines autorisées
 * En production, ne jamais utiliser '*'
 */
const allowedOrigins = [
  "http://localhost:5173", // Vite dev
  "http://localhost:3000", // Production locale
  "http://127.0.0.1:5173", // Vite dev (127.0.0.1)
  "http://127.0.0.1:3000", // Production locale (127.0.0.1)
  // Ajouter domaine production si déployé
  // "https://jarvis.example.com",
];

/**
 * Options CORS strictes
 */
export const corsOptions = {
  /**
   * Fonction de vérification de l'origine
   * Rejette toute origine non whitelistée
   */
  origin: (origin, callback) => {
    // Autoriser requêtes sans origin (Postman, curl, etc.) en dev uniquement
    if (!origin && process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: Origin refusée: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },

  /**
   * Autoriser credentials (cookies, headers auth)
   */
  credentials: true,

  /**
   * Méthodes HTTP autorisées
   */
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

  /**
   * Headers autorisés
   */
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],

  /**
   * Headers exposés au client
   */
  exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],

  /**
   * Durée de cache preflight (OPTIONS)
   */
  maxAge: 86400, // 24 heures
};

/**
 * Middleware CORS configuré
 */
export const corsMiddleware = cors(corsOptions);
