# 📘 Guide Utilisateur J.A.R.V.I.S. 2026

Guide pratique rapide pour utiliser J.A.R.V.I.S. au quotidien.

---

## 🚀 Démarrage en 3 Minutes

### 1️⃣ Première Utilisation

```bash
# Terminal
npm install
echo "VITE_GEMINI_API_KEY=VOTRE_CLE" > .env
npm run dev
```

### 2️⃣ Ouvrir dans Navigateur

**URL** : http://localhost:5173

### 3️⃣ Autoriser Microphone

Cliquer sur **"Autoriser"** dans la popup navigateur

### 4️⃣ Activer JARVIS

Cliquer sur le bouton **"ACTIVATE"** (bas-droite)

### 5️⃣ Parler !

```
"Ouvre Chrome"
```

---

## 🎤 Comment Utiliser

### Mode Simple (Commande par Commande)

1. **Cliquer** sur ACTIVATE
2. **Parler** une commande
3. **JARVIS** exécute et répond
4. **Clic** à nouveau pour nouvelle commande

### Mode Conversation (Recommandé)

1. **Cliquer** sur ACTIVATE
2. **Parler** première commande
3. **JARVIS** reste actif automatiquement
4. **Continuer** à parler sans cliquer
5. **Dire "Au revoir"** pour arrêter

---

## 📝 Exemples de Commandes

### 🖥️ Lancer des Applications

```bash
✅ "Ouvre Chrome"
✅ "Lance Visual Studio Code"
✅ "Démarre Spotify"
✅ "Ouvre le Bloc-notes"
```

### 🔍 Recherche Web

```bash
✅ "Recherche React hooks sur Google"
✅ "Cherche restaurants près de moi"
✅ "Google comment faire un gâteau"
```

### 📁 Gestion Fichiers

```bash
✅ "Crée un fichier notes.txt"
✅ "Supprime ancien.log"
✅ "Recherche fichiers PDF dans Documents"
✅ "Organise mon bureau"
```

### 🎵 Contrôle Média

```bash
✅ "Monte le volume"
✅ "Volume à 50%"
✅ "Pause"
✅ "Piste suivante"
✅ "Prends une capture d'écran"
```

### ⚙️ Système

```bash
✅ "Verrouille la session"
✅ "Éteins l'ordinateur dans 10 minutes"
✅ "Redémarre le PC"
```

### 💬 Conversation

```bash
✅ "Quelle heure est-il ?"
✅ "Comment vas-tu ?"
✅ "Raconte-moi une blague"
✅ "Au revoir" (arrête l'écoute)
```

---

## 🎨 Interface Expliquée

### Vue d'Ensemble

```
┌─────────────────────────────────────────┐
│ [Stats CPU]  [JARVIS]  [Activity] [Logs]│
│                                         │
│ [Hex]        [HUD]                      │
│              Central                    │
│                                  [Visu] │
│ [Time]      [Grille]           [MICRO] │
└─────────────────────────────────────────┘
```

### Éléments Interactifs

| Élément | Position | Fonction |
|---------|----------|----------|
| **Bouton ACTIVATE** | Bas-droite | Active/désactive micro |
| **Logs** | Centre-droite | Historique actions |
| **HUD Central** | Centre | Indicateur d'état |

### Couleurs d'État

| Couleur | Signification |
|---------|---------------|
| **Cyan** 🔵 | Repos / Écoute |
| **Violet** 🟣 | Analyse en cours |
| **Doré** 🟡 | JARVIS parle |
| **Rouge** 🔴 | Erreur |

---

## 🔧 Réglages Rapides

### Changer la Langue

Fichier `.env` :
```env
VITE_VOICE_LANGUAGE=fr-FR  # Français
VITE_VOICE_LANGUAGE=en-US  # Anglais US
VITE_VOICE_LANGUAGE=en-GB  # Anglais UK
```

### Ajuster Volume JARVIS

Paramètres système → Son → Voix

---

## ⚠️ Problèmes Fréquents

### ❌ "JARVIS ne répond pas"

**Solutions** :
1. Vérifier clé API Gemini dans `.env`
2. Vérifier connexion internet
3. Regarder logs (panneau droite)
4. F12 → Console pour erreurs

### ❌ "Micro ne marche pas"

**Solutions** :
1. Autoriser micro dans navigateur
2. Chrome → chrome://settings/content/microphone
3. Tester avec application Enregistreur Windows
4. Redémarrer navigateur

### ❌ "JARVIS s'écoute lui-même"

**Solutions** :
- **Utiliser un casque** (recommandé)
- Baisser le volume système
- Éloigner micro des haut-parleurs
- C'est normal si volume trop élevé

### ❌ "Commandes non comprises"

**Solutions** :
- Parler clairement et distinctement
- Éviter bruit ambiant
- Répéter différemment
- Vérifier langue (FR vs EN)

---

## 💡 Astuces & Bonnes Pratiques

### ✅ Pour Meilleure Reconnaissance

1. **Environnement calme** - Éviter bruit de fond
2. **Micro de qualité** - Headset > micro PC
3. **Distance 20-30cm** - Ni trop près, ni trop loin
4. **Articulation claire** - Pas besoin de crier
5. **Pauses** - Laisser JARVIS finir avant nouvelle commande

### ✅ Formulation Efficace

**❌ Éviter** :
- "Euh... Jarvis... peux-tu... euh... ouvrir Chrome ?"

**✅ Préférer** :
- "Ouvre Chrome"

**✅ Naturel aussi OK** :
- "Peux-tu ouvrir Chrome s'il te plaît ?"

### ✅ Mode Conversation

**Activation Auto** :
- Pas besoin de dire "mode conversation"
- Activé dès la première commande
- JARVIS continue d'écouter tout seul

**Désactivation** :
- Dire : "Au revoir", "Stop", "C'est tout"
- Ou cliquer sur bouton micro

---

## 🎯 Cas d'Usage Concrets

### 📊 Productivité Bureau

```bash
1. "Ouvre Visual Studio Code"
2. "Lance Spotify"
3. "Volume à 30%"
4. "Crée un fichier projet.md"
5. "Lance un timer de 25 minutes"  (Pomodoro)
```

### 🎮 Gaming

```bash
1. "Lance Steam"
2. "Monte le volume à 80%"
3. "Ne pas déranger pendant 2 heures"
```

### 📚 Recherche / Études

```bash
1. "Recherche cours React sur Google"
2. "Ouvre Wikipedia"
3. "Crée une note révisions mathématiques"
4. "Rappelle-moi de réviser à 18h"
```

### 🏠 Fin de Journée

```bash
1. "Ferme toutes les applications"
2. "Organise mon bureau"
3. "Éteins l'ordinateur dans 5 minutes"
4. "Au revoir Jarvis"
```

---

## 🔐 Sécurité

### ⚠️ Important

- ❌ **Ne jamais partager** votre clé API Gemini
- ✅ **Fichier .env** doit être dans `.gitignore`
- ✅ **Régénérer clé** si compromise
- ✅ Vérifier **quota quotidien** (1500 gratuit)

### 🔒 Données Privées

- ✅ Aucune donnée envoyée à serveur externe
- ✅ Seulement texte commande → Gemini
- ✅ Mémoire locale uniquement (localStorage)
- ✅ Pas de tracking utilisateur

---

## 📞 Obtenir de l'Aide

### 🐛 Signaler un Bug

GitHub Issues : [github.com/votre-repo/issues](https://github.com)

**Informations à fournir** :
- Version navigateur
- Message d'erreur (Console F12)
- Commande qui ne marche pas
- Logs système (panneau droite)

### 💬 Poser une Question

- GitHub Discussions
- Discord communauté
- Email : support@jarvis2026.dev

---

## 📈 Aller Plus Loin

### 🎓 Tutoriels Vidéo
- [YouTube - Configuration](https://youtube.com)
- [YouTube - Commandes Avancées](https://youtube.com)
- [YouTube - Personnalisation](https://youtube.com)

### 📖 Documentation Complète
Voir `README_COMPLET.md` pour :
- Architecture technique
- Ajouter nouvelles commandes
- Créer plugins
- Contribuer au projet

---

## 🎉 Profitez de J.A.R.V.I.S. !

Vous êtes maintenant prêt à utiliser J.A.R.V.I.S. comme un pro ! 🚀

**N'oubliez pas** : Plus vous l'utilisez, mieux il comprend vos habitudes.

---

<div align="center">

**Questions ? → README_COMPLET.md**

**Besoin d'aide ? → GitHub Issues**

**Bon voyage avec J.A.R.V.I.S. ! 🤖✨**

</div>
