# 📖 J.A.R.V.I.S. 2026 - MANUEL GLOBAL (Fonctionnement, Features, Utilisation)

## 1. 🎯 Objectif et Philosophie

**J.A.R.V.I.S.** (Just A Rather Very Intelligent System) est un assistant personnel "agentic" centralisant la gestion locale (Windows/Système), domotique (Home Assistant), capteurs (TrueNAS, IoT) et interactions intelligentes (Gemini 2.5 Flash).
Ce document centralise l’intégralité de son fonctionnement, de sa configuration et des commandes disponibles.

---

## 2. ⚙️ Fonctionnement Interne (Le Flux d'Action)

Le système fonctionne sur une boucle d'écoute et de traitement en temps réel orchestrée par **33 outils (tools) d'intelligence artificielle** :

1. **Écoute passive / Activation** : La détection du mot magique "Jarvis" ou un clic manuel sur la sphère déclenche l'écoute active (Speech-to-Text).
2. **Analyse de l'Intention (Backend AI)** : La requête textuelle ("_Ouvre le garage et mets de la musique_") est envoyée au processeur Gemini.
3. **Sélection des Outils (Tool Execution)** : L'IA sélectionne le(s) outil(s) métier approprié(s) parmi ses 33 capacités (ex: `security_ha` + `media_spotify`).
4. **Action (APIs & Système)** : Le backend exécute les scripts locaux (PowerShell pour le volume, appels REST pour Home Assistant, requêtes WS pour Klipper/Bambu).
5. **Feedback Audio/Visuel** : J.A.R.V.I.S. synthétise une réponse (TTS) synchronisée avec la sphère 3D locale.

> _Note de conception_ : Toutes les requêtes voix et API transitent d'abord par un middleware de sécurité (CORS strict, Rate Limiting) validé côté Backend Node.js.

---

## 3. 💎 Liste Détaillée des Fonctionnalités (Features)

J.A.R.V.I.S. regroupe 9 grandes catégories métier :

### 3.1. Gestion Système & Windows

- **Ouverture Programmatique** : Localisation et lancement d'exécutables définis dans `appsDatabase.ts`.
- **Contrôle Hardware local** : Volume (0-100%, Mute), Luminosité d'écran.
- **Gestion des Fenêtres** : Positionnement, focus, réduction, ou fermeture de toute application en cours.
- **Opérations Processus & Fichiers** : Tuer un processus lourd, lister la RAM/CPU allouée, chercher récursivement des fichiers sur les disques.

### 3.2. Domotique Avancée (Home Assistant)

- **Environnement** : Contrôle des lumières (couleur, intensité), prises connectées, scènes.
- **Sécurité** : État des ouvrants (portes/fenêtres), armement/désarmement d'alarmes, visionnage des snapchats de caméras.

### 3.3. Impression 3D (Écosystème Bambu Lab & Klipper)

- **Monitoring Réel** : Retour des températures (buse, lit), pourcentages d'achèvement, temps restant.
- **Pilotage de l'imprimante** : Pause, démarrage anticipé, analyse visuelle des impressions ratées via webcam.

### 4.4. Vision et Perception de Contexte (AI Vision)

- **Lecture de l'écran** : Résumer le contenu affiché, extraire du texte (OCR) ou inspecter du code directement depuis l'éditeur ouvert.
- **Sentinel Mode / Webcam** : Analyse d'images en temps réel capturées par la caméra de l'ordinateur.

### 3.5. Surveillance & Monitoring Infra (TrueNAS)

- **Ressources NAS** : Audit des "Pools" de stockage (capacité, santé).
- **Hard Drives** : États SMART, températures des disques.

### 3.6. Smartphone & KDE Connect (Android)

- **Interaction Mobile** : Envoi de SMS en dictée vocale, passage d'appels.
- **Hardware Mobile** : Niveau de batterie, Ping pour retrouver le téléphone.

### 3.7. Outils Multimédias & Média Centers

- **YouTube** : Recherche de vidéos pertinentes, contrôle lecture.
- **Spotify** : Play/Pause, gestion des playlists.
- **Plex** : Lancement d'un film ou d'une série spécifique sur un écran ciblé.

### 3.8. Productivité & Organisation (Google Workspace)

- **Calendrier** : Déplacement d'événements, recherche d'horaires libres, rappels temporels.
- **Maps** : Estimation de temps de trajet avec trafic en temps réel pour une destination dictée.

---

## 4. 🖱️ Utilisation Pratique & Commandes de Base

### 4.1. Lancement du Système

Ouvrir un terminal PowerShell à la racine du projet `A:\02-PROJECTS\Jarvis2026\` :

```bash
.\start-jarvis.bat
```

_(Ce script initialise le Backend Node.js et démarre le serveur de développement Vite React)._

### 4.2. Raccourcis Constants

| Action                 | Raccourci / Déclencheur                                       |
| :--------------------- | :------------------------------------------------------------ |
| **Réveil Manuel**      | Clic gauche sur la Sphère 3D de l'UI                          |
| **Barge-in (Stop)**    | Dire "Stop", "Attends", "Coupe"                               |
| **Ghost Mode Trigger** | `Win + J` (Déclenche une analyse silencieuse)                 |
| **Privacy Toggle**     | Bouton dédié sur l'UI (Désactive micro/caméra matériellement) |

### 4.3. Exemples de formulation (Intention Mixte)

- **Simples** : _"Jarvis, mets la musique sur Spotify"_, _"Quelle est la température du jardin ?"_
- **Combinées** : _"Allume le bureau à 50%, mets le volume à 30% et ouvre Visual Studio Code."_
- **Contextuelles (Vision)** : _"Lis-moi cette erreur à l'écran et dis-moi comment la corriger."_
- **Introspectives** : _"Combien de RAM consomme le processus Chrome actuellement ?"_

---

## 5. 🛠️ Configuration Initiale (Rappel)

Pour que l'intégralité des modules soit fonctionnelle, les variables d'environnement suivantes doivent être définies dans `.env.local` :

- `VITE_GEMINI_API_KEY` : Clé d'API Google Generative AI (Indispensable).
- `VITE_HA_URL` / `VITE_HA_TOKEN` : Intégration Home Assistant (Optionnel, requis pour domotique).
- `VITE_WEATHER_API_KEY` : Météo locale via OpenWeatherMap (Optionnel).

---

> **Note d'Architecture :**
> Toute évolution ou ajout de nouvelle "fonction" implique l'association de 3 couches : un handler React (`handlers/`), une route de service Backend (`server/routes/`), et la définition de l'outil d'exécution (`services/geminiTools.ts`). Se référer à [ARCHITECTURE.md](../ARCHITECTURE.md) pour les standards de contribution.
