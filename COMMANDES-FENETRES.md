# 🪟 Commandes Vocales de Gestion de Fenêtres

## ✅ Nouvelles Commandes Ajoutées

J'ai ajouté toutes les commandes de gestion de fenêtres à J.A.R.V.I.S.

---

## 🎯 Commandes Disponibles

### 1️⃣ Lancer une Application
```
"Jarvis, ouvre Chrome"
"Lance Bambu Studio"
"Démarre Visual Studio Code"
"Ouvre le bloc-notes"
```

### 2️⃣ Fermer une Application
```
"Jarvis, ferme Chrome"
"Fermer Spotify"
"Close VSCode"
```

### 3️⃣ Mettre au Premier Plan (Focus)
```
"Jarvis, affiche Chrome"
"Montre VSCode"
"Bascule sur Spotify"
"Mets Chrome au premier plan"
```

### 4️⃣ Réduire une Fenêtre
```
"Jarvis, réduis Chrome"
"Minimise Spotify"
"Minimize VSCode"
```

### 5️⃣ Agrandir une Fenêtre
```
"Jarvis, agrandis Chrome"
"Maximise VSCode"
"Mets Chrome en plein écran"
```

---

## 🔧 Comment Ça Fonctionne

### Détection Automatique par Gemini

Gemini détecte automatiquement le type d'action à partir de vos mots-clés :

| Mots-clés | Action | Outil Utilisé |
|-----------|--------|---------------|
| **ferme, fermer, close, quit** | Fermer l'app | `manage_window(action="close")` |
| **affiche, montre, focus, premier plan** | Mettre au 1er plan | `manage_window(action="focus")` |
| **réduis, minimise, minimize** | Réduire | `manage_window(action="minimize")` |
| **agrandis, maximise, maximize, plein écran** | Agrandir | `manage_window(action="maximize")` |

---

## 🧪 Test des Nouvelles Commandes

### Scénario de Test Complet

1. **Lancer** :
   ```
   "Jarvis, ouvre Chrome"
   ```

2. **Réduire** :
   ```
   "Jarvis, réduis Chrome"
   ```

3. **Remettre au premier plan** :
   ```
   "Jarvis, affiche Chrome"
   ```

4. **Agrandir** :
   ```
   "Jarvis, agrandis Chrome"
   ```

5. **Fermer** :
   ```
   "Jarvis, ferme Chrome"
   ```

---

## 📊 Ce Qui a Été Modifié

### 1. `services/geminiService.ts`
Ajout des instructions pour Gemini :

```typescript
- **Close Application**: "ferme", "fermer", "close", "quit" + app name
  → ALWAYS use 'manage_window' with action="close"
  
- **Focus Application**: "affiche", "montre", "focus", "premier plan" + app name
  → ALWAYS use 'manage_window' with action="focus"
  
- **Minimize Window**: "réduis", "minimise", "minimize" + app name
  → ALWAYS use 'manage_window' with action="minimize"
  
- **Maximize Window**: "agrandis", "maximise", "maximize" + app name
  → ALWAYS use 'manage_window' with action="maximize"
```

### 2. `handlers/systemHandlers.ts`
Correction du nom de paramètre :
- `window_title` → `windowTitle` (pour correspondre à l'outil Gemini)

---

## 🔍 Debug

### Dans la Console du Navigateur (F12)

Vous devriez voir :

```javascript
🧠 [BRAIN] Intent: 1 tool to execute
⚙️ [KERNEL] Executing: manage_window
   { windowTitle: "Chrome", action: "close" }
✅ [KERNEL] Tool completed
```

### Dans le Terminal Backend

```
🔍 Closing window: "Chrome"
✅ Window closed successfully
```

---

## ⚠️ Notes Importantes

### Nom de la Fenêtre vs Nom de l'Application

Le système cherche la fenêtre par **titre approximatif** :

| Vous dites | Fenêtre trouvée |
|------------|-----------------|
| "Chrome" | Toute fenêtre contenant "Chrome" |
| "VSCode" | "Visual Studio Code" |
| "Spotify" | "Spotify Premium" ou "Spotify" |
| "Bloc-notes" | "Notepad" ou "Bloc-notes" |

Le système est **tolérant** : il cherche le titre qui correspond le mieux.

---

## 💡 Exemples d'Usage Pratique

### Workflow Multi-Applications

```bash
# Ouvrir votre environnement de travail
"Jarvis, ouvre Chrome"
"Ouvre VSCode"
"Lance Spotify"

# Ranger votre espace de travail
"Réduis Spotify"
"Affiche VSCode"

# Nettoyer à la fin
"Ferme Spotify"
"Ferme Chrome"
```

### Navigation Rapide

```bash
# Basculer entre apps
"Affiche Chrome"
"Montre VSCode"
"Bascule sur Spotify"
```

### Gestion de l'Espace

```bash
# Maximiser pour le focus
"Mets VSCode en plein écran"

# Réduire pour le rangement
"Réduis toutes les fenêtres"
```

---

## 🚀 Prochaines Étapes

**Rechargez la page** (Ctrl+F5) et testez :

```
1. "Jarvis, ouvre le bloc-notes"
2. "Jarvis, réduis le bloc-notes"
3. "Jarvis, affiche le bloc-notes"
4. "Jarvis, ferme le bloc-notes"
```

Toutes ces commandes devraient fonctionner parfaitement ! 🎉
