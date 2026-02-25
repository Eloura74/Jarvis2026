/**
 * geminiProxyService.js — Proxy Gemini côté backend (S1)
 *
 * Problème résolu : VITE_GEMINI_API_KEY était exposée dans le bundle JS
 * envoyé au navigateur → extractable en 30 secondes via DevTools.
 *
 * Solution : Tous les appels Gemini passent par ce service backend.
 * La clé API reste dans process.env (jamais envoyée au client).
 *
 * Architecture :
 * Frontend → POST /api/gemini/stream → geminiProxyService → Google API
 *                                    ↓
 *                              SSE chunks → Frontend
 *
 * Le frontend reçoit les chunks via SSE (text/event-stream) exactement
 * comme avant, sans changement de comportement visible.
 */

import { GoogleGenAI } from "@google/genai";

// Clé API stockée uniquement côté serveur (jamais exposée au client)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ [Gemini Proxy] GEMINI_API_KEY manquante dans process.env");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Modèles avec fallback automatique
const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-1.5-flash";

// Délai minimum entre requêtes (rate limiting doux)
let lastRequestTime = 0;
const MIN_REQUEST_GAP_MS = 1000;

/**
 * Attend si nécessaire pour respecter le délai minimum entre requêtes.
 */
async function waitIfNecessary() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_GAP_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Génère un flux de contenu Gemini avec fallback automatique.
 *
 * @param {string|Array} contents - Contenu à envoyer à Gemini
 * @param {object} config - Configuration (systemInstruction, tools, temperature, maxOutputTokens)
 * @param {boolean} useFallback - Utiliser le modèle de fallback directement
 * @returns {AsyncIterable} Flux de chunks Gemini
 */
async function generateStreamWithFallback(
  contents,
  config,
  useFallback = false,
) {
  const model = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
  try {
    return await ai.models.generateContentStream({ model, contents, config });
  } catch (error) {
    // Logger l'erreur complète pour debug
    console.error(`❌ [Gemini Proxy] Erreur ${model}:`, {
      status: error.status,
      message: error.message,
      hasThinkingConfig: !!config.thinkingConfig,
    });

    const isRetryable =
      error.status === 429 ||
      error.status === 503 ||
      error.status === 500 ||
      error.message?.includes("429");

    // Si erreur 400 (détectée via message car status peut être undefined) avec thinkingConfig, réessayer sans
    const is400Error =
      error.status === 400 || error.message?.includes("400 Bad Request");
    const is400WithThinking = is400Error && config.thinkingConfig;

    if (is400WithThinking && !useFallback) {
      console.warn(
        `⚠️ [Gemini Proxy] Erreur 400 avec thinkingConfig → retry sans thinking`,
      );
      const configWithoutThinking = { ...config };
      delete configWithoutThinking.thinkingConfig;
      try {
        return await ai.models.generateContentStream({
          model,
          contents,
          config: configWithoutThinking,
        });
      } catch (retryError) {
        // Si erreur 400 persiste, c'est probablement l'historique multi-tours
        const is400Again =
          retryError.status === 400 ||
          retryError.message?.includes("400 Bad Request");
        if (is400Again && Array.isArray(contents)) {
          console.warn(
            `⚠️ [Gemini Proxy] Erreur 400 persiste → retry sans historique multi-tours`,
          );
          // Extraire uniquement le dernier message (input utilisateur)
          const lastMessage = contents[contents.length - 1];
          const simpleContents = lastMessage?.parts?.[0]?.text || contents;
          return await ai.models.generateContentStream({
            model,
            contents: simpleContents,
            config: configWithoutThinking,
          });
        }
        throw retryError;
      }
    }

    if (isRetryable && !useFallback) {
      console.warn(
        `⚠️ [Gemini Proxy] ${PRIMARY_MODEL} indisponible → bascule sur ${FALLBACK_MODEL}`,
      );
      return await ai.models.generateContentStream({
        model: FALLBACK_MODEL,
        contents,
        config,
      });
    }
    throw error;
  }
}

/**
 * Traite une requête de streaming Gemini et écrit les chunks dans la réponse SSE.
 *
 * @param {object} req - Requête Express
 *   body: {
 *     input           {string}   - Texte de la commande utilisateur (obligatoire)
 *     systemInstruction {string} - Instructions système (personnalité JARVIS)
 *     tools           {Array}    - Déclarations d'outils Gemini
 *     temperature     {number}   - Température (défaut: 0.1)
 *     maxOutputTokens {number}   - Limite tokens sortie (optionnel)
 *     history         {Array}    - Historique multi-tours format GeminiContent[]
 *     thinkingBudget  {number}   - Budget réflexion : -1=auto, 0=off, >0=tokens
 *   }
 * @param {object} res - Réponse Express (SSE text/event-stream)
 */
export async function handleGeminiStream(req, res) {
  // En-têtes SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const {
    input,
    systemInstruction,
    tools,
    temperature,
    maxOutputTokens,
    history,
    // thinkingBudget : budget de réflexion Gemini 2.5 Flash
    // -1 = automatique, 0 = désactivé, >0 = tokens alloués
    // undefined = non fourni → on n'active pas thinkingConfig
    thinkingBudget,
  } = req.body;

  if (!input) {
    res.write(
      `data: ${JSON.stringify({ type: "error", message: "Paramètre 'input' manquant" })}\n\n`,
    );
    res.end();
    return;
  }

  try {
    await waitIfNecessary();

    // Construction du thinkingConfig si un budget est fourni et non nul.
    // Budget 0 = désactivé → on n'envoie pas le paramètre (économie de tokens).
    // Budget -1 = automatique (Gemini décide selon la complexité perçue).
    // Budget >0 = nombre de tokens alloués à la réflexion interne.
    // La réflexion est SUPERPOSÉE au streaming : Gemini "pense" en interne
    // puis génère la réponse finale en flux continu sans latence perceptible.
    const thinkingConfig =
      thinkingBudget !== undefined && thinkingBudget !== 0
        ? { thinkingBudget }
        : undefined;

    const config = {
      systemInstruction,
      tools: tools ? [{ functionDeclarations: tools }] : undefined,
      temperature: temperature ?? 0.1,
      ...(maxOutputTokens !== undefined && { maxOutputTokens }),
      // Injecter thinkingConfig uniquement si défini (évite erreur API si non supporté)
      ...(thinkingConfig !== undefined && { thinkingConfig }),
    };

    if (thinkingConfig) {
      console.log(
        `🧠 [Gemini Proxy] Thinking budget activé: ${thinkingBudget === -1 ? "AUTO" : thinkingBudget + " tokens"}`,
      );
    }

    // Construction du tableau contents :
    // - Si un historique multi-tours est fourni (format GeminiContent[]), on l'utilise
    //   comme contexte natif. Gemini comprend nativement les rôles user/model.
    // - On ajoute le message courant en dernier (rôle "user").
    // - Si pas d'historique, on passe juste le message courant (comportement précédent).
    let contents;
    if (Array.isArray(history) && history.length > 0) {
      // Validation défensive : chaque entrée doit avoir role et parts[0].text
      // ET le texte ne doit pas être "undefined" ou vide
      const validHistory = history.filter(
        (h) =>
          (h.role === "user" || h.role === "model") &&
          Array.isArray(h.parts) &&
          h.parts.length > 0 &&
          typeof h.parts[0].text === "string" &&
          h.parts[0].text.trim() !== "" &&
          h.parts[0].text !== "undefined" &&
          !h.parts[0].text.includes("undefined"),
      );
      // Ajouter le message courant en dernier
      contents = [...validHistory, { role: "user", parts: [{ text: input }] }];
      console.log(
        `📚 [Gemini Proxy] Historique multi-tours: ${validHistory.length} tours + message courant`,
      );

      // Log détaillé pour debug erreur 400
      console.log(
        `🔍 [Gemini Proxy] Contents type: ${Array.isArray(contents) ? "array" : typeof contents}, length: ${contents.length}`,
      );
      console.log(
        `🔍 [Gemini Proxy] Premier message:`,
        JSON.stringify(contents[0]).substring(0, 200),
      );
      console.log(
        `🔍 [Gemini Proxy] Dernier message:`,
        JSON.stringify(contents[contents.length - 1]).substring(0, 200),
      );
    } else {
      // Comportement précédent : message seul
      contents = input;
      console.log(`🔍 [Gemini Proxy] Contents type: string, value: "${input}"`);
    }

    // Log config pour debug
    console.log(`🔍 [Gemini Proxy] Config keys:`, Object.keys(config));
    console.log(`🔍 [Gemini Proxy] Has tools:`, !!config.tools);
    console.log(
      `🔍 [Gemini Proxy] Has thinkingConfig:`,
      !!config.thinkingConfig,
    );

    const stream = await generateStreamWithFallback(contents, config);

    // Consommer le flux et envoyer chaque chunk au client via SSE
    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];

      // Chunks texte
      const textParts = parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join("");

      if (textParts) {
        res.write(
          `data: ${JSON.stringify({ type: "text", text: textParts })}\n\n`,
        );
      }

      // Appels d'outils (function calls)
      const functionCalls = parts
        .filter((p) => p.functionCall)
        .map((p) => p.functionCall);

      for (const call of functionCalls) {
        if (call.name && call.args) {
          res.write(
            `data: ${JSON.stringify({ type: "tool", name: call.name, args: call.args })}\n\n`,
          );
        }
      }
    }

    // Signal de fin de flux
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (error) {
    console.error("❌ [Gemini Proxy] Erreur stream:", error.message);

    // Signaler l'erreur au client via SSE avant de fermer
    if (!res.headersSent) {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`,
      );
    } else {
      try {
        res.write(
          `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`,
        );
      } catch {
        // Connexion déjà fermée
      }
    }
    res.end();
  }
}

/**
 * Génère une synthèse courte d'un résultat d'outil (non-streaming).
 * Utilisé par summarizeToolResults côté frontend via /api/gemini/summarize.
 *
 * @param {object} req - body: { prompt }
 * @param {object} res - JSON response: { text }
 */
export async function handleGeminiSummarize(req, res) {
  const { prompt } = req.body;
  if (!prompt)
    return res.status(400).json({ error: "Paramètre 'prompt' manquant" });

  try {
    await waitIfNecessary();
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.1, maxOutputTokens: 200 },
    });
    const text =
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Exécuté, Monsieur.";
    res.json({ text });
  } catch (error) {
    console.error("❌ [Gemini Proxy] Erreur summarize:", error.message);
    // Fallback silencieux
    res.json({ text: "J'ai les résultats, Monsieur." });
  }
}

/**
 * Analyse QMS (Quantum Management System) — suggestions proactives.
 *
 * @param {object} req - body: { prompt }
 * @param {object} res - JSON response: { text }
 */
export async function handleGeminiQMS(req, res) {
  const { prompt } = req.body;
  if (!prompt)
    return res.status(400).json({ error: "Paramètre 'prompt' manquant" });

  try {
    await waitIfNecessary();
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        maxOutputTokens: 300,
      },
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json(text ? JSON.parse(text) : { hasSuggestion: false });
  } catch (error) {
    console.error("❌ [Gemini Proxy] Erreur QMS:", error.message);
    res.json({ hasSuggestion: false });
  }
}
