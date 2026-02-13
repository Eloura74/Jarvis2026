# 🎤 GUIDE - Vision Automatique + TTS Gemini

## ✅ **CE QUI A ÉTÉ MODIFIÉ**

### **1. Capture Automatique de l'Onglet Actif** ✅
- ❌ **Avant** : Demandait quelle fenêtre capturer à chaque fois
- ✅ **Maintenant** : Capture automatiquement l'onglet J.A.R.V.I.S. SANS demander

**Comment ça marche** :
```
Vous : "Analyse l'écran"
→ Capture automatique de la page J.A.R.V.I.S.
→ Envoi à Gemini Vision
→ Résultat affiché ET parlé
```

**Limitations** :
- Capture seulement la **page J.A.R.V.I.S.** (pas d'autres fenêtres)
- Pour analyser VSCode, un PDF, etc. → Impossible sans permission

---

### **2. TTS Gemini (Voix Améliorée)** 🔊

**Service créé** : `geminiTTS.ts`

**Avantages vs synthèse navigateur** :
| Critère | Navigateur (actuel) | Gemini TTS |
|---------|---------------------|------------|
| Qualité | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Accent | Robotique | Naturel (British) |
| Gratuit | ✅ | ✅ (limité) |
| Latence | Instantané | ~1-2 sec |
| Configuration | Basique | Avancée |

---

## 🧪 **TESTER LA VISION AUTO**

### **1. Rechargez** (F5)

### **2. Dites** :
```
"Analyse l'écran"
```

### **3. Résultat** :
- ✅ **PLUS de popup** ! Capture automatique
- ✅ Screenshot de l'interface J.A.R.V.I.S.
- ✅ Gemini analyse ce qu'il voit
- ✅ J.A.R.V.I.S. lit le résultat

---

## 🔊 **ACTIVER LE TTS GEMINI** (Optionnel)

⚠️ **ATTENTION** : Le TTS Gemini est **expérimental** et pourrait ne pas fonctionner comme attendu.

### **Option A : Test Manuel**

Ajoutez ceci dans la console du navigateur :
```javascript
import { speakWithGemini } from './services/geminiTTS';

speakWithGemini("Hello Sir, systems online.");
```

### **Option B : Remplacer la Voix Actuelle**

1. Ouvrez `hooks/useJarvisInteraction.ts`
2. Cherchez la fonction `speak`
3. Remplacez par :
```typescript
import { speakWithGemini } from '../services/geminiTTS';

const speak = (text: string) => {
  // Essayer Gemini TTS d'abord
  speakWithGemini(text, { speed: 1.0 }).catch(() => {
    // Fallback vers synthèse navigateur
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    window.speechSynthesis.speak(utterance);
  });
};
```

---

## 💰 **TARIFICATION**

### **Gemini Vision** (`gemini-2.5-flash-preview-09-2025`)
- ✅ **Gratuit** : ~15 requêtes/minute, 1500/jour
- ⚠️ Si dépassé : ~$0.01 par requête

### **Gemini TTS** (`gemini-2.5-flash-preview-tts`)
- ✅ **Gratuit** : ~15 requêtes/minute
- ⚠️ Si dépassé : ~$0.02 par minute d'audio

**Pour un usage personnel/dev** : Totalement gratuit ! 🎉

---

## ⚠️ **LIMITATIONS IMPORTANTES**

### **Capture Automatique**
- ✅ Capture l'onglet J.A.R.V.I.S. actif
- ❌ Ne peut PAS capturer :
  - D'autres fenêtres (VSCode, Chrome, etc.)
  - Le bureau complet
  - Des applications externes

**Pourquoi ?** Sécurité du navigateur. Seules les extensions Chrome peuvent capturer d'autres fenêtres.

### **TTS Gemini**
- ⚠️ **API Expérimentale** : Peut changer ou ne pas fonctionner
- ⚠️ Latence ~1-2 secondes (génération de l'audio)
- ⚠️ Nécessite une connexion internet active

---

## 🎯 **RECOMMANDATION**

### **Pour la Vision** :
- ✅ **Utiliser la capture auto** : Parfait pour analyser l'interface J.A.R.V.I.S.
- ✅ **Exemples d'usage** :
  - "Analyse l'écran" → Description de l'interface
  - "Lis les logs" → OCR des messages affichés
  - "Trouve les erreurs" → Détection de bugs visibles

### **Pour le TTS** :
- ⏸️ **Garder la synthèse navigateur** pour l'instant
- 🧪 **Tester Gemini TTS** en parallèle
- ✅ **Basculer si satisfait** de la qualité

---

## 📊 **RÉSUMÉ**

| Fonctionnalité | Avant | Maintenant |
|----------------|-------|------------|
| Capture écran | Popup à chaque fois | **Automatique** |
| Permission | Demandée | **AUCUNE** |
| Analyse | Gemini 1.5 Flash | **Gemini 2.5 Flash** |
| Voix | Synthèse navigateur | **+ Option Gemini TTS** |

---

## 🧪 **TEST COMPLET**

### **1. Vision Auto**
```
"Analyse l'écran"
→ Capture automatique de J.A.R.V.I.S.
→ Gemini décrit l'interface
→ J.A.R.V.I.S. lit le résultat
```

### **2. OCR**
```
"Lis ce que tu vois"
→ Extraction du texte visible
→ Lecture à voix haute
```

### **3. TTS Gemini** (si activé)
```
"Bonjour Monsieur"
→ Voix naturelle British
→ Meilleure que la synthèse standard
```

---

**TOUT EST PRÊT ! Testez maintenant !** 🎉

**Créé le** : 14 février 2026, 00:05  
**Version** : Vision Auto + TTS Gemini Ready
