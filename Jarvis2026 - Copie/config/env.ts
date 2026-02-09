/**
 * Module de configuration et validation de l'environnement
 *
 * Ce fichier s'assure que toutes les variables d'environnement requises
 * sont présentes et valides avant le démarrage de l'application.
 *
 * SÉCURITÉ : La clé API Gemini doit être définie dans .env.local
 * et ne JAMAIS être committée dans Git.
 */

/**
 * Interface de la configuration d'environnement validée
 */
interface EnvironmentConfig {
  geminiApiKey: string;
}

/**
 * Valide et retourne la configuration d'environnement
 *
 * Cette fonction vérifie que la clé API Gemini est bien définie
 * dans les variables d'environnement Vite (import.meta.env).
 *
 * IMPORTANT : Avec Vite, les variables d'environnement doivent :
 * - Être préfixées par VITE_ pour être exposées au client
 * - Être définies dans .env.local (pour dev) ou .env (production)
 *
 * @throws {Error} Si la clé API est manquante ou invalide
 * @returns {EnvironmentConfig} Configuration validée et prête à l'emploi
 *
 * @example
 * ```typescript
 * try {
 *   const config = validateEnv();
 *   console.log('Configuration OK');
 * } catch (error) {
 *   console.error('Erreur configuration:', error.message);
 * }
 * ```
 */
export function validateEnv(): EnvironmentConfig {
  // Récupération de la clé API Gemini depuis les variables d'environnement Vite
  // Note : import.meta.env est fourni par Vite et contient toutes les variables VITE_*
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Validation : s'assure que la clé existe et n'est pas la valeur par défaut
  if (!apiKey || apiKey === "your_api_key_here" || apiKey.trim() === "") {
    throw new Error(
      "🔒 ERREUR SÉCURITÉ: La variable d'environnement VITE_GEMINI_API_KEY " +
        "est manquante ou invalide dans le fichier .env.local.\n\n" +
        "👉 SOLUTION :\n" +
        "1. Créez un fichier .env.local à la racine du projet\n" +
        "2. Ajoutez cette ligne :\n" +
        "   VITE_GEMINI_API_KEY=votre_clé_api_gemini_ici\n" +
        "3. Obtenez votre clé sur : https://ai.google.dev/\n" +
        "4. Redémarrez le serveur de développement (npm run dev)",
    );
  }

  // Log de confirmation (sans afficher la clé pour des raisons de sécurité)
  console.log("✅ Configuration environnement validée");
  console.log(`🔑 Clé API chargée (${apiKey.substring(0, 10)}...)`);

  return {
    geminiApiKey: apiKey,
  };
}

/**
 * Récupère la configuration sans validation (pour les tests)
 *
 * ATTENTION : À utiliser uniquement dans les tests unitaires
 * ou dans des contextes où la validation a déjà été effectuée.
 *
 * @returns {EnvironmentConfig | null} Configuration si disponible, null sinon
 */
export function getEnvUnsafe(): EnvironmentConfig | null {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return { geminiApiKey: apiKey };
}
