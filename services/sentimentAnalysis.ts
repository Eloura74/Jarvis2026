/**
 * Sentiment Analysis pour J.A.R.V.I.S.
 *
 * Analyse le ton et l'humeur de l'utilisateur basé sur :
 * - Choix de mots (positifs vs négatifs)
 * - Ponctuation (!!!, ???)
 * - Contexte temporel (historique récent)
 * - Patterns de commandes (stress = commandes rapides répétées)
 *
 * Utilisé pour adapter les réponses de JARVIS
 * (plus empathique si mood négatif, plus concis si stressé, etc.)
 *
 * @module sentimentAnalysis
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Humeur détectée de l'utilisateur
 */
export interface UserMood {
  /** Valence émotionnelle (-1 = très négatif, +1 = très positif) */
  valence: number;
  /** Arousal (énergie) (0 = calme, 1 = excité/stressé) */
  arousal: number;
  /** Timestamp de détection */
  timestamp: number;
  /** Mots-clés détectés */
  keywords: string[];
  /** Confiance du score (0-1) */
  confidence: number;
}

/**
 * Historique des moods détectés (dernières 10 interactions)
 */
const moodHistory: UserMood[] = [];

// ============================================================================
// LEXIQUE ÉMOTIONNEL
// ============================================================================

/** Mots positifs */
const POSITIVE_WORDS = [
  "merci",
  "excellent",
  "parfait",
  "super",
  "génial",
  "bravo",
  "bien",
  "top",
  "cool",
  "ok",
  "okay",
  "bon",
  "bonne",
  "content",
  "heureux",
  "thanks",
  "great",
  "perfect",
  "good",
  "nice",
  "awesome",
  "love",
];

/** Mots négatifs */
const NEGATIVE_WORDS = [
  "merde",
  "erreur",
  "bug",
  "problème",
  "crash",
  "cassé",
  "nul",
  "mauvais",
  "pire",
  "arrête",
  "stop",
  "non",
  "fuck",
  "damn",
  "error",
  "fail",
  "broken",
  "bad",
  "worst",
  "shit",
  "crap",
  "ugh",
];

/** Mots de stress/urgence */
const STRESS_WORDS = [
  "vite",
  "urgent",
  "maintenant",
  "now",
  "immédiatement",
  "quickly",
  "rapide",
  "fast",
  "asap",
  "help",
  "aide",
  "sos",
];

/** Mots de calme */
const CALM_WORDS = [
  "calme",
  "doucement",
  "tranquille",
  "relax",
  "lentement",
  "slowly",
  "chill",
  "peace",
  "zen",
  "cool",
];

// ============================================================================
// ANALYSE DE SENTIMENT
// ============================================================================

/**
 * Analyse le sentiment d'un texte utilisateur
 *
 * @param text - Texte de la commande utilisateur
 * @param commandFrequency - Nb de commandes dans les 2 dernières minutes (optionnel)
 * @returns Mood détecté
 */
export function analyzeSentiment(
  text: string,
  commandFrequency?: number,
): UserMood {
  const normalized = text.toLowerCase();
  const words = normalized.split(/\s+/);

  // Compter les marqueurs émotionnels
  let positiveCount = 0;
  let negativeCount = 0;
  let stressCount = 0;
  let calmCount = 0;

  const detectedKeywords: string[] = [];

  for (const word of words) {
    if (POSITIVE_WORDS.includes(word)) {
      positiveCount++;
      detectedKeywords.push(`+${word}`);
    }
    if (NEGATIVE_WORDS.includes(word)) {
      negativeCount++;
      detectedKeywords.push(`-${word}`);
    }
    if (STRESS_WORDS.includes(word)) {
      stressCount++;
      detectedKeywords.push(`!${word}`);
    }
    if (CALM_WORDS.includes(word)) {
      calmCount++;
      detectedKeywords.push(`~${word}`);
    }
  }

  // Analyser la ponctuation
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;

  // Calculer valence (-1 à +1)
  const rawValence = positiveCount - negativeCount;
  const valence = Math.max(
    -1,
    Math.min(1, rawValence / Math.max(words.length / 10, 1)),
  );

  // Calculer arousal (0 à 1)
  let arousal = (stressCount - calmCount) / Math.max(words.length / 10, 1);

  // Facteurs supplémentaires d'arousal
  arousal += exclamationCount * 0.1;
  arousal += capsRatio * 0.3;
  arousal += (commandFrequency || 0) > 3 ? 0.2 : 0; // Commandes rapides = stress

  arousal = Math.max(0, Math.min(1, arousal));

  // Confiance basée sur le nombre de mots-clés détectés
  const totalKeywords = positiveCount + negativeCount + stressCount + calmCount;
  const confidence = Math.min(1, totalKeywords / 3);

  const mood: UserMood = {
    valence,
    arousal,
    timestamp: Date.now(),
    keywords: detectedKeywords,
    confidence,
  };

  // Ajouter à l'historique
  moodHistory.push(mood);
  if (moodHistory.length > 10) {
    moodHistory.shift();
  }

  logMood(mood, text);

  return mood;
}

/**
 * Récupère le mood moyen des N dernières interactions
 */
export function getAverageMood(lastN: number = 5): UserMood | null {
  if (moodHistory.length === 0) return null;

  const recent = moodHistory.slice(-lastN);
  const avgValence =
    recent.reduce((sum, m) => sum + m.valence, 0) / recent.length;
  const avgArousal =
    recent.reduce((sum, m) => sum + m.arousal, 0) / recent.length;
  const avgConfidence =
    recent.reduce((sum, m) => sum + m.confidence, 0) / recent.length;

  return {
    valence: avgValence,
    arousal: avgArousal,
    timestamp: Date.now(),
    keywords: [],
    confidence: avgConfidence,
  };
}

/**
 * Récupère l'historique complet des moods
 */
export function getMoodHistory(): UserMood[] {
  return [...moodHistory];
}

/**
 * Reset l'historique (pour tests ou nouvelle session)
 */
export function resetMoodHistory(): void {
  moodHistory.length = 0;
  console.log("🧠 Historique émotionnel réinitialisé");
}

// ============================================================================
// SUGGESTIONS BASÉES SUR LE MOOD
// ============================================================================

/**
 * Suggère une action adaptée au mood actuel
 *
 * @param mood - Mood détecté
 * @returns Suggestion d'action (ou null)
 */
export function suggestMoodAction(mood: UserMood): {
  type: string;
  message: string;
  action: any;
} | null {
  // Mood très négatif + stress élevé
  if (mood.valence < -0.5 && mood.arousal > 0.6) {
    return {
      type: "calm_music",
      message:
        "Vous semblez tendu, Monsieur. Puis-je lancer une playlist relaxante ?",
      action: { tool: "play_spotify", playlist: "Calming Music" },
    };
  }

  // Mood négatif modéré
  if (mood.valence < -0.3) {
    return {
      type: "empathy",
      message:
        "Quelque chose ne va pas, Monsieur ? Je suis là si vous avez besoin d'aide.",
      action: null,
    };
  }

  // Stress élevé sans negativité (concentration)
  if (mood.arousal > 0.7 && mood.valence >= -0.2) {
    return {
      type: "focus_mode",
      message: "Vous semblez très concentré. Activer le mode Focus ?",
      action: { tool: "enable_focus_mode" },
    };
  }

  // Mood très positif
  if (mood.valence > 0.6) {
    return {
      type: "celebration",
      message: "Ravi de vous voir de bonne humeur, Monsieur !",
      action: null,
    };
  }

  return null;
}

// ============================================================================
// ADAPTATION DE RÉPONSE
// ============================================================================

/**
 * Adapte le style de réponse selon le mood
 *
 * @param baseResponse - Réponse de base de JARVIS
 * @param mood - Mood détecté
 * @returns Réponse adaptée
 */
export function adaptResponseToMood(
  baseResponse: string,
  mood: UserMood,
): string {
  // Mood négatif : plus empathique
  if (mood.valence < -0.3) {
    const empathyPrefixes = [
      "Je comprends, Monsieur. ",
      "Bien sûr, Monsieur. ",
      "À vos ordres, Monsieur. ",
    ];
    const prefix =
      empathyPrefixes[Math.floor(Math.random() * empathyPrefixes.length)];
    return prefix + baseResponse;
  }

  // Stress élevé : plus concis
  if (mood.arousal > 0.6) {
    // Retirer les formules de politesse superflues
    return baseResponse.replace(/^(Bien sûr|Très bien|D'accord),?\s*/i, "");
  }

  // Mood positif : plus enthousiaste
  if (mood.valence > 0.5) {
    return baseResponse + " 😊";
  }

  return baseResponse;
}

// ============================================================================
// LOGGING
// ============================================================================

function logMood(mood: UserMood, text: string): void {
  const valenceLabel =
    mood.valence > 0.3
      ? "😊 Positif"
      : mood.valence < -0.3
        ? "😟 Négatif"
        : "😐 Neutre";

  const arousalLabel =
    mood.arousal > 0.6
      ? "⚡ Stressé"
      : mood.arousal < 0.3
        ? "🧘 Calme"
        : "➡️ Normal";

  console.log(
    `🧠 Sentiment: ${valenceLabel} | ${arousalLabel} | ` +
      `Confiance: ${(mood.confidence * 100).toFixed(0)}% | ` +
      `Texte: "${text.slice(0, 50)}..."`,
  );

  if (mood.keywords.length > 0) {
    console.log(`   Mots-clés: ${mood.keywords.join(", ")}`);
  }
}
