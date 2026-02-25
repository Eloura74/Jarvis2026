/**
 * Middleware de gestion centralisée des erreurs
 * Logging et réponses sécurisées
 */

/**
 * Middleware de gestion des erreurs
 * À placer en dernier dans la chaîne de middlewares
 */
export const errorHandler = (err, req, res, next) => {
  // Log l'erreur complète côté serveur
  console.error("❌ [ERROR]", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Déterminer le status code
  const statusCode = err.statusCode || err.status || 500;

  // Préparer la réponse
  const response = {
    error: err.message || "Internal server error",
    status: statusCode,
  };

  // En développement, inclure la stack trace
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.details = err.details;
  }

  // Envoyer la réponse
  res.status(statusCode).json(response);
};

/**
 * Middleware pour gérer les routes non trouvées (404)
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Wrapper async pour éviter try/catch dans chaque route
 * 
 * @param {Function} fn - Fonction async de route
 * @returns {Function} Middleware Express
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
