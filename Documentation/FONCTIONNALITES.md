# 🧠 Capacités & Fonctionnalités de J.A.R.V.I.S.

Ce document recense l'intégralité des fonctionnalités actuellement implémentées dans votre assistant personnel **J.A.R.V.I.S. (Just A Rather Very Intelligent System)**.

---

## 💎 Identité & Interface

- **Design "Iron Man"** : Interface dark mode, éléments holographiques cyan/bleu, typographie technique.
- **Séquence de Lancement** : Vidéo d'introduction cinéma suivie d'un rapport vocal système synchronisé.
- **Visualiseur Vocal** : Sphère holographique animée réagissant en temps réel à la voix (Utilisateur & IA).
- **Mode "Focus"** : Overlay minimaliste pour les interactions rapides.

## 🗣️ Interaction Vocale & Multimodale

- **Conversation Naturelle** : Dialogue fluide avec mémoire à court terme (contexte conservé).
- **Synthèse Vocale (TTS)** : Voix native du système (rapide et légère) ou ElevenLabs (si configuré).
- **Reconnaissance Vocale (STT)** : Transcription temps réel (Web Speech API).
- **Wake Word** : Activation par mot-clé (si activé dans les paramètres).
- **Interruptions (Barge-in)** : Capacité de couper la parole à J.A.R.V.I.S. avec des mots-clefs ("Stop", "Attends").
- **Intention Mixte** : Capacité de comprendre une demande complexe impliquant à la fois une réponse verbale et une action technique (ex: "Explique-moi le code et ouvre VS Code").

## 🖥️ Contrôle Système & Windows

- **Lancement d'Applications** : Indexation et lancement de tout logiciel installé (ex: "Lance Chrome", "Ouvre Photoshop").
- **Gestion des Fenêtres** :
  - `Focus` : Mettre une fenêtre au premier plan.
  - `Minimiser/Maximiser` : Gérer l'état des fenêtres.
  - `Fermer` : Quitter une application.
- **Contrôle Hardware** :
  - Ajostement Volume (0-100%, Mute/Unmute).
  - Luminosité Écran.
- **Session** : Verrouillage, Redémarrage, Arrêt, Veille.
- **Automatisation Clavier** : Simulation de frappe et raccourcis clavier (Ctrl+C, Alt+Tab, etc.).

## 📂 Gestion de Fichiers

- **Explorateur Intelligent** : Navigation, listing et recherche de fichiers avec support des jokers (\*.txt).
- **Opérations CRUD** : Créer, Lire, Copier, Déplacer, Supprimer fichiers et dossiers.
- **Accès Rapide** : Raccourcis vers les dossiers utilisateur (Documents, Downloads, etc.).

## 👁️ Vision & Analyse d'Écran

- **Analyse Globale** : "Que vois-tu à l'écran ?" (Description du contexte).
- **OCR (Reconnaissance de Texte)** : Extraction de texte depuis n'importe quelle fenêtre.
- **Débogage Visuel** : Analyse des erreurs affichées à l'écran ("Analyse cette erreur").
- **Analyse de Code** : Lecture et explication de code visible à l'écran.

## 🌐 Web & Connectivité

- **Recherche Web** : Google, YouTube, Wikipedia, GitHub.
- **Navigation** : Ouverture d'URL spécifiques.
- **Services Google (API)** :
  - **Gmail** : Lecture (avec filtres de recherche) et Envoi d'emails.
  - **Calendar** : Consultation des prochains évènements.
  - _Sécurité_ : Authentification OAuth2 sécurisée côté Backend.

## 🏠 Domotique (Home Assistant)

- **Contrôle des Lumières** : On/Off, Luminosité, Changement de couleur.
- **Gestion des Entités** : Commande universelle pour tout appareil connecté à HA (Prises, Switches, Scènes).
- **Contexte Intelligent** : J.A.R.V.I.S. connaît l'état de votre maison (température, lumières allumées) pour enrichir ses réponses.

## 🛠️ Outils de Productivité

- **Notes & To-Do** : Gestion de listes de tâches et prise de notes rapides.
- **Rappels & Minuteurs** : Définition d'alarmes (ex: "Rappelle-moi de sortir dans 10 min").
- **Capture d'Écran** : Prise de screenshot instantanée.

---

> SYSTEM STATUS: ALL SYSTEMS NOMINAL.
