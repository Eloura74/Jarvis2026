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
async function generateStreamWithFallback(contents, config, useFallback = false) {
  const model = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
  try {
    return await ai.models.generateContentStream({ model, contents, config });
  } catch (error) {
    const isRetryable =
      error.status === 429 || error.status === 503 || error.status === 500 ||
      error.message?.includes("429");

    if (isRetryable && !useFallback) {
      console.warn(`⚠️ [Gemini Proxy] ${PRIMARY_MODEL} indisponible → bascule sur ${FALLBACK_MODEL}`);
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
 * @param {object} req - Requête Express (body: { input, systemInstruction, tools, temperature, maxOutputTokens })
 * @param {object} res - Réponse Express (SSE text/event-stream)
 */
export async function handleGeminiStream(req, res) {
  // En-têtes SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { input, systemInstruction, tools, temperature, maxOutputTokens } = req.body;

  if (!input) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Paramètre 'input' manquant" })}\n\n`);
    res.end();
    return;
  }

  try {
    await waitIfNecessary();

    const config = {
      systemInstruction,
      tools: tools ? [{ functionDeclarations: tools }] : undefined,
      temperature: temperature ?? 0.1,
      ...(maxOutputTokens !== undefined && { maxOutputTokens }),
    };

    const stream = await generateStreamWithFallback(input, config);

    // Consommer le flux et envoyer chaque chunk au client via SSE
    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];

      // Chunks texte
      const textParts = parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join("");

      if (textParts) {
        res.write(`data: ${JSON.stringify({ type: "text", text: textParts })}\n\n`);
      }

      // Appels d'outils (function calls)
      const functionCalls = parts
        .filter((p) => p.functionCall)
        .map((p) => p.functionCall);

      for (const call of functionCalls) {
        if (call.name && call.args) {
          res.write(`data: ${JSON.stringify({ type: "tool", name: call.name, args: call.args })}\n\n`);
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
      res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
    } else {
      try {
        res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
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
  if (!prompt) return res.status(400).json({ error: "Paramètre 'prompt' manquant" });

  try {
    await waitIfNecessary();
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.1, maxOutputTokens: 200 },
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "Exécuté, Monsieur.";
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
  if (!prompt) return res.status(400).json({ error: "Paramètre 'prompt' manquant" });

  try {
    await waitIfNecessary();
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.1, responseMimeType: "application/json", maxOutputTokens: 300 },
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json(text ? JSON.parse(text) : { hasSuggestion: false });
  } catch (error) {
    console.error("❌ [Gemini Proxy] Erreur QMS:", error.message);
    res.json({ hasSuggestion: false });
  }
}
