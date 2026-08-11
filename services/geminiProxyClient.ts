/**
 * geminiProxyClient.ts — Client frontend pour le proxy Gemini backend (S1)
 *
 * Remplace les appels directs à @google/genai (qui exposaient la clé API
 * dans le bundle JS) par des appels HTTP vers le backend Node.js.
 *
 * La clé API Gemini reste exclusivement dans process.env côté serveur.
 *
 * Interface identique à l'ancien client GoogleGenAI pour minimiser
 * les changements dans geminiService.ts.
 */

const BACKEND_URL = "http://localhost:3001";

// ============================================================================
// TYPES
// ============================================================================

export interface ProxyStreamChunk {
  type: "text" | "tool" | "done" | "error";
  text?: string;
  name?: string;
  args?: Record<string, unknown>;
  message?: string;
}

/**
 * Un tour de conversation au format natif Gemini (role + parts).
 * Transmis tel quel au backend qui le passe à l'API Gemini.
 */
export interface GeminiHistoryEntry {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface ProxyStreamConfig {
  systemInstruction?: string;
  tools?: unknown[];
  temperature?: number;
  maxOutputTokens?: number;
  /**
   * Historique de conversation au format natif Gemini Content[].
   * Permet à Gemini de comprendre le contexte multi-tours nativement,
   * au lieu d'un texte brut injecté dans le system prompt.
   * Le message courant (input) sera ajouté en dernier par le backend.
   */
  history?: GeminiHistoryEntry[];
  /**
   * Budget de réflexion Gemini 2.5 Flash (thinking budget).
   * -1 = automatique (Gemini décide), 0 = désactivé, >0 = tokens alloués.
   * Voir geminiThinkingConfig.ts pour les constantes et le helper.
   */
  thinkingBudget?: number;
  /**
   * Force ou restreint l'utilisation d'outils (gemini parameter)
   */
  toolChoice?: "AUTO" | "ANY" | "NONE";
  /**
   * Liste restreinte de tools autorisés. Si fournie, le backend active
   * le mode ANY (appel de tool obligatoire) limité à ces fonctions.
   * ATTENTION : ne jamais activer ANY avec les 57 tools (erreur "too much branching").
   */
  allowedFunctionNames?: string[];
}

// ============================================================================
// STREAMING — Remplace ai.models.generateContentStream()
// ============================================================================

/**
 * Appelle le proxy backend /api/gemini/stream et retourne un itérateur async
 * de chunks, compatible avec le pattern `for await (const chunk of stream)`.
 *
 * @param input - Texte de la commande utilisateur
 * @param config - Configuration Gemini (systemInstruction, tools, temperature, maxOutputTokens)
 * @returns AsyncIterable de ProxyStreamChunk
 */
export async function* generateContentStreamProxy(
  input: string,
  config: ProxyStreamConfig,
): AsyncGenerator<ProxyStreamChunk> {
  // On destructure explicitement pour s'assurer que thinkingBudget est transmis
  // même si la valeur est 0 (désactivé) — JSON.stringify(0) est valide.
  const { thinkingBudget, ...restConfig } = config;
  const body: Record<string, unknown> = { input, ...restConfig };
  if (thinkingBudget !== undefined) {
    body.thinkingBudget = thinkingBudget;
  }

  const response = await fetch(`${BACKEND_URL}/api/gemini/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    throw new Error(
      `Gemini proxy error: ${response.status} ${response.statusText}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // Lire le flux SSE ligne par ligne
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");

    // Garder la dernière ligne incomplète dans le buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const chunk: ProxyStreamChunk = JSON.parse(jsonStr);
        yield chunk;
        if (chunk.type === "done" || chunk.type === "error") return;
      } catch {
        // Ignorer les lignes malformées
      }
    }
  }
}

// ============================================================================
// SYNTHÈSE — Remplace ai.models.generateContent() pour les résumés
// ============================================================================

/**
 * Appelle le proxy backend /api/gemini/summarize pour une synthèse courte.
 * Non-streaming, retourne directement le texte.
 *
 * @param prompt - Prompt de synthèse
 * @returns Texte de synthèse
 */
export async function generateSummarizeProxy(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/gemini/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { text: string };
    return data.text || "Exécuté, Monsieur.";
  } catch (err) {
    console.error("❌ [Gemini Proxy Client] Erreur summarize:", err);
    return "J'ai les résultats, Monsieur.";
  }
}

// ============================================================================
// QMS — Remplace ai.models.generateContent() pour l'analyse QMS
// ============================================================================

/**
 * Appelle le proxy backend /api/gemini/qms pour l'analyse proactive.
 *
 * @param prompt - Prompt QMS
 * @returns Objet { hasSuggestion, tool?, args?, explanation? }
 */
export async function generateQMSProxy(prompt: string): Promise<{
  hasSuggestion: boolean;
  tool?: string;
  args?: Record<string, unknown>;
  explanation?: string;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/gemini/qms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("❌ [Gemini Proxy Client] Erreur QMS:", err);
    return { hasSuggestion: false };
  }
}
