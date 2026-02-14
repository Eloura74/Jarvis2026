# 🎬 Plan d'Action : Vidéo de Présentation J.A.R.V.I.S.

## 🎯 Objectif

Démontrer la puissance, la réactivité et la personnalité de l'assistant J.A.R.V.I.S. à travers une vidéo scénarisée mettant en avant ses capacités multimédias, domotiques et productives.

## 📝 Structure de la Vidéo

### 1. Introduction "WAKE UP" (0:00 - 0:30)

- **Visuel** : Écran noir ou veille.
- **Action** : Réveil du système par commande vocale.
- **Effet** : Allumage de l'interface, animations HUD, salutation vocale et visuelle.

### 2. Productivité & Contrôle Fenêtres (0:30 - 1:30)

- **Objectif** : Montrer la fluidité du contrôle des applications.
- **Actions** :
  - Lancer plusieurs apps (Chrome, VSCode).
  - Les organiser (Snap, Focus, Minimize).
  - Fermer une application vocale.

### 3. Intelligence & Recherche (1:30 - 2:30)

- **Objectif** : Montrer l'intégration de Gemini et la recherche visuelle.
- **Actions** :
  - Poser une question complexe.
  - Demander une recherche d'images ("Montre-moi...").
  - Analyser l'écran ("Que vois-tu à l'écran ?").

### 4. Multimédia & Immersion (2:30 - 3:30)

- **Objectif** : Ambiance et contrôle média.
- **Actions** :
  - Lancer de la musique (Spotify).
  - Contrôler le volume.
  - Mettre en pause / Suivant.

### 5. Final "SHUTDOWN" (3:30 - 4:00)

- **Visuel** : Retour au calme.
- **Action** : Commande de mise en veille ou fermeture.
- **Phrase de fin** : "À votre service, Monsieur."

---

## 🗣️ Script & Commandes Détaillées

### Séquence 1 : Le Réveil

_Utilisateur face à l'écran éteint ou interface minimaliste._

1.  **Utilisateur** : "Jarvis ?" ou "Réveille-toi."
2.  **Jarvis** : "Pour vous servir, Monsieur. Systèmes en ligne."
3.  **Utilisateur** : "Quelle heure est-il et quel est l'état du système ?"
4.  **Jarvis** : (Affiche l'heure et le statut via le tool `system_optimization` ou réponse texte) "Il est [Heure]. Tous les systèmes fonctionnent à capacité optimale."

### Séquence 2 : Productivité Maximale

_Démonstration de la rapidité d'exécution._

5.  **Utilisateur** : "Lance Visual Studio Code et ouvre Chrome."
    - _Note : Commande multiple._
6.  **Jarvis** : "Exécution immédiate." (Ouvre les fenêtres)
7.  **Utilisateur** : "Mets VSCode en plein écran."
    - _Commande_ : `manage_window(action="maximize")`
8.  **Utilisateur** : "Réduis Chrome."
    - _Commande_ : `manage_window(action="minimize")`
9.  **Utilisateur** : "En fait, montre-moi Chrome et cherche 'Actualités IA' sur Google."
    - _Commande_ : `search_and_launch_app(url="...")`

### Séquence 3 : Vision & Créativité

_Utilisation des capacités multimodales._

10. **Utilisateur** : "Analyse mon écran. Que vois-tu ?"
    - _Commande_ : `analyze_screen(type="general")`
11. **Jarvis** : (Décrit le contenu de la page Chrome ouverte).
12. **Utilisateur** : "Génère une image de voiture futuriste style Cyberpunk." (Si fonctionnalité image dispo) OU "Montre-moi des images de concept cars futuristes."
    - _Commande_ : `show_images(query="concept car futuriste cyberpunk")`
13. **Jarvis** : Affiche les images dans l'interface.

### Séquence 4 : Détente

_Contrôle média._

14. **Utilisateur** : "Lance Spotify et mets une musique de concentration."
    - _Commande_ : `search_and_launch_app("spotify")` (puis play via interaction ou commande si dispo).
15. **Utilisateur** : "Augmente le volume."
    - _Commande_ : `control_media(action="VOLUME_UP")`
16. **Utilisateur** : "C'est parfait. Ferme les fenêtres inutiles."
    - _Commande_ : `manage_window` (série de fermetures ou manuel).
    - _Alternative_ : "Ferme Chrome."

### Séquence 5 : Conclusion

17. **Utilisateur** : "Merci Jarvis. Passe en mode veille."
    - _Commande_ : `control_session(action="sleep")` ou juste une réponse de fin.
18. **Jarvis** : "À très bientôt, Monsieur." (L'écran s'assombrit).

## 💡 Conseils pour la Vidéo

- **Capture** : Utilisez OBS pour capturer l'écran en haute qualité (60fps).
- **Audio** : Assurez-vous que la voix de Jarvis est bien audible (mixage audio : voix > fond sonore).
- **Rythme** : Ne laissez pas trop de temps mort entre la commande et l'action (le système est rapide, montrez-le).
- **Montage** : Ajoutez une musique de fond très légère "High Tech" pour l'ambiance.

## 🛠️ Préparatifs avant l'enregistrement

1.  Fermer toutes les fenêtres parasites.
2.  Vider le cache de Jarvis (si nécessaire) pour avoir des réponses fraîches.
3.  Vérifier que le volume TTS est correct.
4.  Préparer les onglets ou fichiers pour la démo "Productivité" pour que ça s'ouvre vite.
