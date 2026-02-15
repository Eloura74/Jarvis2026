# 🎬 Guide de Démonstration Magistrale : J.A.R.V.I.S. 2026

Ce guide est conçu pour vous accompagner lors de votre vidéo de présentation. Il détaille chaque fonctionnalité, de l'identité visuelle aux agents autonomes les plus complexes.

---

## 🏎️ Séquence 1 : Lancement & Identité

_Montrer l'effet "Wow" et l'immersion immédiate._

1. **Le Boot cinématique** :
   - Lancer l'application.
   - Laisser la vidéo d'introduction se jouer (vidéo Iron Man).
   - Écouter le rapport vocal initial : _"Mainframe initialized. Biometric scan complete..."_
2. **L'Interface Holographique** :
   - Pointer la **sphère centrale** : elle réagit à votre voix et à celle de l'IA (Three.js/Shaders).
   - Montrer le **HUD (Heads-Up Display)** : design technique cyan, dark mode premium.
3. **La Personnalité** :
   - Lui dire simplement : _"Bonjour Jarvis."_
   - Notez le ton : Britannique, élégant, vous appelle "Monsieur".

## 🧠 Séquence 2 : Intelligence & Conversation

_Démontrer la puissance de Gemini 2.0 Flash et la fluidité._

1. **Intelligence Générale** : Posez une question complexe (ex: _"Jarvis, explique-moi la théorie de la relativité en deux phrases."_).
2. **Correction Phonétique** : Démontrez que Jarvis "comprend mal mais agit bien".
   - Dites volontairement : _"Cherche sur Michael World un support de téléphone."_
   - Jarvis doit corriger en **MakerWorld** sans demander de confirmation.
3. **Contexte Continu** :
   - _"Quel temps fait-il à Paris ?"_ (Jarvis répond).
   - Enchaînez : _"Et à Londres ?"_ (Il comprend que vous parlez toujours de météo).

## 🔬 Séquence 3 : Agent de Recherche Profonde (Deep Research)

_La fonctionnalité la plus avancée : l'agent autonome._

1. **L'Action Autonome** :
   - Dites : _"Jarvis, cherche le dernier modèle de support téléphone sur MakerWorld, analyse la description et fais-moi un rapport sur le bureau dans le fichier 'test_demo.txt'."_
2. **Ce qu'il faut montrer** :
   - Jarvis ouvre DuckDuckGo ou MakerWorld en arrière-plan (via Puppeteer).
   - Il **lit** le contenu (Extraction de texte intelligente).
   - Il **chaîne** les outils : il n'attend pas d'ordre pour écrire le fichier.
   - Montrez le fichier apparaître sur le bureau avec un contenu structuré.

## 💾 Séquence 4 : Conscience & Mémoire (RAG Local)

_Montrer que Jarvis connaît vos fichiers personnels._

1. **Indexation** : Jarvis a scanné vos dossiers (`a:\02-PROJECTS\Jarvis2026`).
2. **Recherche Sémantique** :
   - Posez une question sur votre code : _"Comment Jarvis gère-t-il la sécurité des fichiers ?"_
   - Jarvis utilise `consult_memory`, lit `secureFileManager.js` et vous explique sa propre logique.

## 🖥️ Séquence 5 : Contrôle Système & Bureautique

_JARVIS comme extension de vos mains._

1. **Applications** : _"Lance Chrome"_, _"Ouvre VS Code"_.
2. **Fenêtres** : _"Maximise la fenêtre de Chrome"_, _"Focus sur VS Code"_.
3. **Hardware** : _"Mets le volume à 20%"_, _"Prends une capture d'écran"_.
4. **Productivité** : _"Écris un mail à [Nom] pour dire que la démo est prête."_ (Via Gmail API).

## 🏠 Séquence 6 : Immersion Domotique (Home Assistant)

_Le contrôle de votre environnement._

1. **Contrôle Direct** : _"Allume la lumière du bureau en rouge."_
2. **État de la Maison** : Jarvis connaît la température ou si les prises sont allumées grâce à l'injection de contexte dynamique.
3. **Combo** : _"Jarvis, prépare le bureau pour le travail."_ (Doit pouvoir enchaîner ouverture d'app et réglage lumière).

## 🔐 Séquence 7 : Sécurité & Transparence

_Un système pro-actif et sûr._

1. **Secure File Manager** : Montrez qu'il refuse d'écrire dans `C:\Windows` mais accepte le **Bureau** et vos projets.
2. **Monitoring des Tokens** : Montrez le petit compteur de tokens (Config Panel) : Jarvis est transparent sur sa consommation.

---

### 💡 Tips pour la vidéo :

- **Parlez naturellement** : Jarvis gère les hésitations.
- **Utilisez les interruptions** : Si Jarvis parle trop, dites _"Stop"_ pour montrer qu'il écoute en permanence.
- **Effet de chaîne** : Demandez toujours une action après une recherche (ex: "Cherche X et écris le résultat dans Y"). C'est là que Jarvis brille le plus.

> **STATUS : PRÊT POUR LE SHOWREEL, MONSIEUR.**
