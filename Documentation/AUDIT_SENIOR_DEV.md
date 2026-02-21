# JARVIS 2026 — AUDIT TECHNIQUE COMPLET
### Rapport d'équipe Senior Dev · Février 2026

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble du projet](#1-vue-densemble)
2. [Architecture & Stack technique](#2-architecture)
3. [Inventaire des fonctionnalités](#3-inventaire)
4. [Ce qui fonctionne bien](#4-ce-qui-fonctionne-bien)
5. [Bugs & Problèmes identifiés](#5-bugs)
6. [Dette technique & Code smell](#6-dette-technique)
7. [Sécurité & Risques](#7-securite)
8. [Performances](#8-performances)
9. [Améliorations proposées](#9-ameliorations)
10. [Nouvelles fonctionnalités](#10-nouvelles-fonctionnalites)
11. [Roadmap priorisée](#11-roadmap)
12. [Commandes utiles](#12-commandes)

---

## 1. Vue d'ensemble

**JARVIS 2026** est un assistant personnel IA immersif de type Iron Man, combinant :
- Interface holographique React 19 / TypeScript (Vite)
- Backend Node.js Express (API REST + SSE)
- Modèle IA Gemini 2.5 Flash (Google) avec function calling + streaming
- Sphère physique ESP32-S3 + écran GC9A01 240×240 (LovyanGFX, 22 modes visuels)
- Intégrations : Home Assistant, WhatsApp, Gmail, Google Calendar, Bambu Lab MQTT, Klipper/Moonraker, Google Maps

**Taille du projet :**
- ~50 fichiers TypeScript/TSX frontend
- ~30 fichiers JavaScript backend
- ~834 lignes C++ ESP32
- ~25 services métier · ~12 handlers d'outils · ~28 hooks React

---

## 2. Architecture

### Frontend (Vite + React 19 + TypeScript)
```
index.tsx → App.tsx → JarvisCore.tsx
                    ↓
            useJarvisBrain.ts         ← Orchestrateur IA
                    ↓
            useToolExecutor.ts        ← Routeur d'outils (switch 30+ cas)
                    ↓
            handlers/*.ts             ← Exécuteurs métier
                    ↓
            services/*.ts             ← Couche API/logique
```

### Backend (Node.js Express)
```
server.js → routes/*.js → services/*.js
                        ↓
                  googleService.js    ← OAuth2 Gmail/Calendar
                  sphereService.js    ← Série ESP32
                  whatsappService.js  ← WhatsApp Web (Puppeteer)
                  bambuMqtt.js        ← MQTT TLS Bambu Lab
                  localMemory.js      ← RAG local (indexation fichiers)
```

### ESP32 (PlatformIO + LovyanGFX)
```
main.cpp → OrbState enum (22 états) → renderMode*() → loop() 30 FPS
         → Serial parser (MODE X / TEXT X)
         → 450 nodes 3D, screensaver organique
```

### Canaux de communication
| Canal | Usage |
|---|---|
| HTTP REST | Frontend ↔ Backend |
| SSE (EventSource) | Backend → Frontend (push) |
| Serial USB | Backend → ESP32 |
| MQTT TLS | Backend → Bambu Lab A1 Mini |
| WebSocket | Backend → Klipper/Moonraker |
| OAuth2 | Backend → Google APIs |
| Puppeteer | Backend → WhatsApp Web |

---

## 3. Inventaire des fonctionnalités

### Actives et opérationnelles ✅

| Fonctionnalité | Fichiers clés |
|---|---|
| Wake word "Jarvis" (seuil 0.75) | `useWakeWord.ts` |
| STT Web Speech API (seuil confiance 0.65) | `useVoiceRecognition.ts` |
| TTS Web Speech API (queue, SPEAKING sphère) | `useVoiceSynthesis.ts` |
| Mode conversation continue (15s timeout) | `useJarvisInteraction.ts` |
| Anti-écho 3.5s + filtre transcription pendant parole | `useJarvisInteraction.ts` |
| Barge-in STOP vocal (mots-clés) | `useJarvisInteraction.ts` |
| Gemini 2.5 Flash streaming | `geminiService.ts` |
| Fallback automatique Gemini 1.5 Flash | `geminiService.ts` |
| Lancement d'applications Windows | `systemHandlers.ts` |
| Recherche web (Google/YouTube/GitHub) | `webHandlers.ts` |
| Contrôle volume système | `systemHandlers.ts` |
| Gestion fenêtres (focus/minimize/close) | `systemHandlers.ts` |
| Contrôle session (lock/shutdown/restart/sleep) | `sessionHandlers.ts` |
| Gestion fichiers CRUD | `fileHandlers.ts` |
| Météo actuelle + prévisions | `weatherService.ts` |
| Navigation/Trafic temps réel (Google Maps) | `navigationService.ts` |
| Home Assistant (lumières, capteurs, portes) | `homeAssistantService.ts` |
| Gmail lecture (non lus, résumé vocal) | `googleHandlers.ts` |
| Gmail envoi | `googleHandlers.ts` |
| Google Calendar lecture | `googleHandlers.ts` |
| Google Calendar création (ISO 8601) | `googleHandlers.ts` |
| WhatsApp notifications push (SSE) | `whatsappService.js` |
| Bambu Lab MQTT (A1 Mini, fin d'impression) | `bambuMqtt.js` |
| Klipper/Moonraker WebSocket (VZ330, Switchwire) | `useKlipperMoonraker.ts` |
| Sphère ESP32 22 modes visuels | `main.cpp` |
| Analyse écran Vision Gemini | `visionService.ts` |
| Ghost Mode (analyse visuelle webcam/écran) | `ghostMode.ts` |
| Timers / Rappels / Notes / To-Do vocaux | `productivityService.ts` |
| Overlay holographique (statuts, trafic, flotte) | `HolographicStatusOverlay.tsx` |
| Mémoire applicative RAG local | `localMemory.js` |
| Moteur de prédiction (patterns horaires) | `predictionEngine.ts` |
| Workflows automatisés (détection séquences) | `workflowEngine.ts` |
| Cache Gemini LRU 24h + similarité sémantique | `geminiCache.ts` |
| Contexte conversationnel (10 messages) | `conversationContext.ts` |
| Profil psychologique (analyse mood 30j) | `psychProfile.ts` |
| Analyse de sentiment | `sentimentAnalysis.ts` |
| Indexation applications Windows | `appIndexer.js` |
| Push Notifications SSE | `events.js` |
| Quantum Observer (suggestions proactives QMS) | `useQuantumObserver.ts` |
| Overlay Manager (empilage overlays) | `overlayManager.ts` |

### Partielles ou instables ⚠️

| Fonctionnalité | Problème |
|---|---|
| Ghost Mode proactif | Désactivé dans `useQuantumObserver.ts` (quota) |
| Génération d'images | Provider Bing non fiable |
| Autonomie simulée | Messages fictifs, pas d'actions réelles |
| Profil psychologique UI | Peu visible dans l'interface |
| Bookmarks | Implémenté, non testé |

### Dépréciées 🗑️

| Fichier | Raison |
|---|---|
| `services/bambulabsMqtt.ts` | Remplacé par `server/services/bambuMqtt.js` |
| `AppSAVE.tsx` | Ancienne version App.tsx |
| `parseCommand()` dans `geminiService.ts` | Remplacé par `streamCommand()` |

---

## 4. Ce qui fonctionne bien

- **Modularisation** : séparation claire hooks/services/handlers/routes
- **Streaming Gemini** : réponses vocales en temps réel, très fluide
- **Fallback modèle** : bascule auto 2.5-flash → 1.5-flash sur erreur
- **SSE Push** : notifications proactives sans polling (WhatsApp, Bambu)
- **ESP32 multi-modes** : 22 modes visuels, 30 FPS stable, screensaver organique
- **OAuth2 avec refresh** : token Google renouvelé automatiquement
- **Anti-écho vocal** : période sécurité 3.5s + filtre confiance 0.65 + blocage pendant parole
- **Mode conversation continue** : 15s inactivité avant retour wake word
- **Personnalité JARVIS** cohérente (français, "Monsieur", ton élégant)
- **Feedback visuel sphère** synchronisé avec les états système

---

## 5. Bugs

### Critiques 🔴

**B1 — Double connexion SSE**
- `useJarvisBrain.ts` ET `useProactiveEvents.ts` ouvrent chacun une connexion SSE vers `/api/events`
- Chaque événement est traité **deux fois** → double annonce vocale possible
- **Fix** : supprimer la connexion SSE dans `useJarvisBrain.ts`, centraliser dans `useProactiveEvents.ts`

**B2 — Circuit breaker anti-429 désactivé**
- `geminiService.ts` ligne 446 : `return false;` en dur dans `checkShield()`
- Aucune protection contre les bursts de requêtes → risque de ban API
- **Fix** : réactiver avec cooldown 30s

**B3 — Route `/api/automation` doublon**
- `server.js` ligne 59 : `app.use("/api/automation", windowsRoutes)` — doublon non intentionnel
- **Fix** : supprimer ou créer une route dédiée

**B4 — `apps-index.json` de 1.5 MB dans le repo**
- Fichier de cache d'indexation commité (1 565 380 bytes)
- **Fix** : ajouter `server/apps-index.json` au `.gitignore`

**B5 — Chemins hardcodés `C:\Users\Admin\` dans `constants.ts`**
- `MOCK_FILE_SYSTEM` cassera sur tout autre poste
- **Fix** : variables d'environnement ou détection dynamique via `appIndexer.js`

### Mineurs 🟡

**B6 — `ghostMode.ts` et `psychProfile.ts` utilisent `@google/generative-ai` (ancienne lib)**
- Le reste du projet utilise `@google/genai` → deux clients Gemini différents en mémoire
- **Fix** : migrer vers `@google/genai`

**B7 — `homeAssistantService.ts` appelle `/api/states` sans base URL**
- Échoue silencieusement si le proxy Vite n'est pas configuré
- **Fix** : utiliser `VITE_HA_URL` + `/api/states`

**B8 — `parseCommand()` toujours présente mais inutilisée**
- Appelle `getHAContext()` inutilement
- **Fix** : supprimer ou marquer `@deprecated`

**B9 — `useVoiceRecognition.ts` : erreur micro refusé non communiquée**
- Erreur `not-allowed` silencieuse → l'utilisateur ne sait pas pourquoi ça ne marche pas
- **Fix** : `speak("Accès au microphone refusé, Monsieur.")` sur erreur `not-allowed`

---

## 6. Dette technique

### Duplication de code

| Problème | Localisation |
|---|---|
| `STOP_KEYWORDS` défini 2 fois | `useJarvisInteraction.ts` lignes 68-76 et 172-180 |
| Deux instances `GoogleGenAI` | `geminiService.ts` + `visionService.ts` |
| Deux instances `GoogleGenerativeAI` | `ghostMode.ts` + `psychProfile.ts` |
| `setSphereMode()` inline | `useJarvisBrain.ts` — devrait être dans un service |
| Connexion SSE dupliquée | `useJarvisBrain.ts` + `useProactiveEvents.ts` |

### Fichiers orphelins / inutiles

| Fichier | Statut |
|---|---|
| `AppSAVE.tsx` (16 KB) | Ancienne version, à supprimer |
| `services/bambulabsMqtt.ts` | Stubs dépréciés |
| `Bureau`, `dev`, `git`, `npm`, `powershell` | Fichiers vides à la racine |
| `server/rapport coin.txt` | Fichier personnel dans le repo |
| `venv/` | Dossier Python vide |
| `dist/` | Build vide commité |
| `server/routes/apps.ts` | Doublon TypeScript de `apps.js` |

### localStorage surchargé

Le projet stocke ~12 clés différentes dans localStorage sans stratégie de nettoyage globale.
Risque de saturation (quota ~5-10 MB navigateur).

**Clés utilisées :**
`jarvis_usage_patterns`, `jarvis_workflows`, `jarvis_command_history`, `jarvis_gemini_cache`,
`jarvis_conversation_history`, `jarvis_recent_entities`, `jarvis_notes`, `jarvis_todos`,
`jarvis_reminders`, `jarvis-mood-history`, `jarvis-psych-profile`, `jarvis_last_429`, `jarvis_last_qms_scan`

**Fix** : service centralisé `storageService.ts` avec quota management et nettoyage automatique.

---

## 7. Sécurité

### Critiques 🔴

**S1 — Clé API Gemini exposée côté client**
- `VITE_GEMINI_API_KEY` est dans le bundle JS envoyé au navigateur
- Extractable en 30 secondes avec les DevTools
- **Fix** : proxifier tous les appels Gemini via le backend Node.js

**S2 — `server/google_credentials.json` potentiellement dans le repo**
- Credentials OAuth2 Google ne doivent jamais être commités
- **Fix** : vérifier `.gitignore`, utiliser uniquement les variables d'env

**S3 — `server/google_token.json` stocké en clair**
- Contient le refresh_token Google (accès total Gmail/Calendar)
- **Fix** : chiffrer avec `crypto` Node.js ou utiliser un keystore système

**S4 — Endpoint `/api/launch` sans validation de chemin**
- Accepte n'importe quel exécutable → risque d'exécution arbitraire
- **Fix** : valider que le chemin est dans l'index des applications connu

### Modérés 🟡

**S5 — CORS ouvert (`app.use(cors())`)**
- Accepte les requêtes de n'importe quelle origine
- **Fix** : `cors({ origin: 'http://localhost:5173' })` en développement

**S6 — Pas d'authentification sur le backend**
- N'importe qui sur le réseau local peut appeler les APIs
- **Fix** : header `X-Jarvis-Token` partagé entre frontend et backend

**S7 — `.wwebjs_auth/` doit être dans `.gitignore`**
- Contient les cookies de session WhatsApp Web

---

## 8. Performances

**P1 — `getHAContext()` appelé à chaque commande Gemini**
- Requête HTTP vers Home Assistant à chaque `streamCommand()`
- Si HA lent → latence 1-3s sur chaque commande
- **Fix** : cache 30s sur `getHAContext()` avec invalidation manuelle

**P2 — `commandHistory` grandit indéfiniment**
- Tableau React state sans limite dans `useJarvisBrain.ts`
- **Fix** : `setCommandHistory(prev => [newCommand, ...prev].slice(0, 50))`

**P3 — Double EventSource SSE**
- Deux connexions permanentes vers le même endpoint
- **Fix** : centraliser (voir B1)

**P4 — `apps-index.json` 1.5 MB en RAM backend**
- **Fix** : index partiel + recherche par chunks, ou SQLite léger

**P5 — Pas de watchdog hardware ESP32**
- Si firmware plante, sphère reste figée
- **Fix** : `esp_task_wdt_init(30, true)` dans `setup()`

---

## 9. Améliorations proposées

### Vocal & Interaction

**A1 — Regex de split streaming plus intelligente**
- Actuellement : split sur `.!?,;:\n` → "3.5s" ou "192.168.1.1" déclenche un split prématuré
- **Fix** : regex qui ignore les points dans les nombres/IPs/abréviations

**A2 — Feedback "Je vous écoute" après le délai 3.5s**
- L'utilisateur ne sait pas toujours que le micro est prêt
- **Fix** : son discret ou phrase courte après réactivation micro en mode conversation

**A3 — Mode PROCESSING sur la sphère**
- Quand Gemini réfléchit, la sphère reste en IDLE
- **Fix** : envoyer `PROCESSING` depuis `processCommand()` + mode visuel "spirale lente"

**A4 — Contrôle vocal du volume TTS**
- "Parle plus fort / moins vite" → modifier `voiceSettings` en temps réel
- Les types existent déjà, pas encore dans les outils Gemini

**A5 — Luminosité adaptative ESP32**
- Pas de contrôle de luminosité selon l'heure
- **Fix** : commande série `BRIGHT X` depuis le backend selon l'heure

### Intelligence & IA

**A6 — Cache `getHAContext()` 30s**
- Évite une requête HA à chaque commande Gemini
- Impact : -1 à 3s de latence sur chaque interaction

**A7 — Réponses plus courtes**
- Gemini fait des réponses longues malgré `CONCISENESS IS MANDATORY`
- **Fix** : `max_output_tokens: 200` pour les réponses TEXT_RESPONSE simples

**A8 — Mémoire long-terme persistante**
- Contexte conversationnel limité à 10 messages localStorage
- **Fix** : fichier JSON backend + résumé Gemini quotidien

**A9 — Alias personnels**
- "Ouvre mon projet" → Jarvis ne sait pas quel projet
- **Fix** : section "Mes alias" dans les settings

### Intégrations

**A10 — Lecture vocale du contenu WhatsApp**
- Actuellement : Jarvis annonce l'expéditeur mais pas le message
- **Fix** : lire le contenu si < 100 chars

**A11 — Réponse WhatsApp vocale**
- Actuellement : lecture seule
- **Fix** : outil `whatsapp_reply` via `client.sendMessage()`

**A12 — Rappels proactifs Calendar**
- Jarvis ne prévient pas des RDV imminents
- **Fix** : polling Calendar toutes les 15min, annonce si RDV dans < 30min

---

## 10. Nouvelles fonctionnalités

### Court terme (< 1 semaine)

| ID | Fonctionnalité | Complexité |
|---|---|---|
| N1 | **Mode "Ne pas déranger"** — bloque notifications, réduit volume | Faible |
| N2 | **Résumé quotidien enrichi** — météo + RDV + mails au démarrage | Faible |
| N3 | **"Qu'est-ce que tu peux faire ?"** — liste des capacités vocale | Faible |
| N4 | **Historique vocal** — "Répète la dernière commande" | Faible |
| N5 | **Commande "Quel est mon prochain RDV ?"** | Faible |

### Moyen terme (1-4 semaines)

| ID | Fonctionnalité | Complexité |
|---|---|---|
| N6 | **Tableau de bord vocal** — briefing complet en une commande | Moyenne |
| N7 | **Contrôle Spotify** — play/pause/next/volume via API | Moyenne |
| N8 | **Détection d'inactivité** — screensaver + micro veille après 30min | Moyenne |
| N9 | **Profils utilisateurs** — "Mode travail/soirée/nuit" | Moyenne |
| N10 | **Réponse WhatsApp vocale** | Moyenne |
| N11 | **Rappels Calendar proactifs** | Moyenne |
| N12 | **Intégration Telegram** (API officielle, plus stable que WhatsApp) | Moyenne |

### Long terme (> 1 mois)

| ID | Fonctionnalité | Complexité |
|---|---|---|
| N13 | **Mémoire sémantique vectorielle** — remplacer RAG basique | Haute |
| N14 | **Vision continue** — Ghost Mode sur flux webcam permanent | Haute |
| N15 | **TTS custom ElevenLabs** — voix plus naturelle | Haute |
| N16 | **Application mobile compagnon** (PWA ou React Native) | Haute |
| N17 | **Multi-utilisateurs** — profils distincts avec mémoires séparées | Haute |
| N18 | **Intégration domotique étendue** — thermostats, volets, alarme | Haute |

---

## 11. Roadmap priorisée

### Sprint 1 — Stabilisation (Priorité absolue)
1. ✅ Fix B1 : supprimer double connexion SSE
2. ✅ Fix S1 : proxifier Gemini API via backend
3. ✅ Fix B4 : `apps-index.json` dans `.gitignore`
4. ✅ Fix S2/S3 : credentials Google hors repo
5. ✅ Fix B5 : chemins hardcodés → variables d'env
6. ✅ Fix P1 : cache `getHAContext()` 30s
7. ✅ Fix P2 : limiter `commandHistory` à 50 entrées

### Sprint 2 — UX & Vocal
1. A2 : Feedback "Je vous écoute" après 3.5s
2. A3 : Mode PROCESSING sur la sphère
3. A1 : Regex split streaming améliorée
4. N1 : Mode "Ne pas déranger"
5. N2 : Résumé quotidien enrichi
6. B9 : Feedback erreur micro refusé

### Sprint 3 — Intégrations
1. A10 : Lecture vocale contenu WhatsApp
2. A11 : Réponse WhatsApp vocale
3. A12 : Rappels Calendar proactifs
4. N7 : Contrôle Spotify
5. N6 : Tableau de bord vocal

### Sprint 4 — Architecture
1. Migrer `ghostMode.ts` + `psychProfile.ts` vers `@google/genai`
2. Centraliser les instances Gemini
3. Service `storageService.ts` avec quota management
4. Supprimer fichiers orphelins (`AppSAVE.tsx`, stubs Bambu, etc.)
5. Réactiver circuit breaker anti-429

---

## 12. Commandes utiles

### Démarrage
```bat
# Tout démarrer (frontend + backend)
start-jarvis.bat

# Backend seul
cd server && node server.js

# Frontend seul
npm run dev
```

### ESP32 (PlatformIO)
```bash
# Compiler et flasher
pio run --target upload --project-dir sphere

# Monitor série (debug)
pio device monitor --project-dir sphere --baud 115200

# Compiler sans flasher
pio run --project-dir sphere
```

### Maintenance
```bash
# Réindexer les applications Windows
curl -X POST http://localhost:3001/api/reindex

# Vider le cache Gemini (via UI ou console)
# clearDecisionCache() dans geminiService.ts

# Tester la sphère
curl -X POST http://localhost:3001/api/sphere/state -H "Content-Type: application/json" -d "{\"state\":\"SPEAKING\"}"

# Tester Gmail
curl http://localhost:3001/api/google/gmail/list?max=3

# Statut backend
curl http://localhost:3001/api/status
```

### Debug vocal
```javascript
// Dans la console navigateur :
// Voir les patterns de prédiction
JSON.parse(localStorage.getItem('jarvis_usage_patterns'))

// Vider le cache Gemini
localStorage.removeItem('jarvis_gemini_cache')

// Voir l'historique conversation
JSON.parse(localStorage.getItem('jarvis_conversation_history'))
```

---

## Résumé exécutif

| Catégorie | Score | Commentaire |
|---|---|---|
| Fonctionnalités | 9/10 | Couverture exceptionnelle pour un projet solo |
| Architecture | 7/10 | Bonne modularisation, quelques couplages à réduire |
| Sécurité | 4/10 | Clé API exposée côté client = risque majeur |
| Performance | 7/10 | Bon globalement, quelques requêtes redondantes |
| Code quality | 6/10 | Duplication, fichiers orphelins, types `any` |
| Stabilité vocale | 8/10 | Très améliorée, anti-écho robuste |
| ESP32 | 9/10 | Excellent rendu, 22 modes, 30 FPS stable |
| **Global** | **7/10** | **Projet impressionnant, bases solides** |

> **Point fort absolu** : la richesse fonctionnelle et l'immersion sont remarquables pour un projet personnel. La sphère physique + l'IA conversationnelle + la domotique + les imprimantes 3D forment un écosystème unique.
>
> **Point faible absolu** : la clé API Gemini exposée côté client est le risque le plus urgent à corriger.
