# 🔍 Guide Debug : Distinction des Verbes

## ❌ Problème Fréquent

Gemini confond parfois les verbes et appelle le mauvais outil :

```
❌ "minimise opera" → search_and_launch_app (MAUVAIS!)
✅ "minimise opera" → manage_window (BON!)
```

## 🎯 Règle Simple

### 🟢 search_and_launch_app = DÉMARRER
**Seulement pour ces 3 verbes** :
- **ouvre** / open
- **lance** / launch
- **démarre** / start

```
✅ "ouvre opera" → search_and_launch_app
✅ "lance chrome" → search_and_launch_app
✅ "démarre vscode" → search_and_launch_app
```

### 🔴 manage_window = CONTRÔLER
**Pour TOUS les autres verbes** :
- **ferme** / close
- **minimise** / minimize / **réduis**
- **affiche** / show / **montre** / focus
- **agrandis** / maximize

```
✅ "ferme opera" → manage_window (action: "close")
✅ "minimise opera" → manage_window (action: "minimize")
✅ "affiche opera" → manage_window (action: "focus")
✅ "agrandis opera" → manage_window (action: "maximize")
```

---

## 📊 Tableau de Référence

| Commande | Verbe | Outil Correct | Action |
|----------|-------|---------------|--------|
| "ouvre opera" | ouvre | `search_and_launch_app` | - |
| "lance opera" | lance | `search_and_launch_app` | - |
| "démarre opera" | démarre | `search_and_launch_app` | - |
| **"ferme opera"** | ferme | `manage_window` | `close` |
| **"minimise opera"** | minimise | `manage_window` | `minimize` |
| **"réduis opera"** | réduis | `manage_window` | `minimize` |
| **"affiche opera"** | affiche | `manage_window` | `focus` |
| **"montre opera"** | montre | `manage_window` | `focus` |
| **"agrandis opera"** | agrandis | `manage_window` | `maximize` |

---

## 🔧 Modifications Appliquées

### Dans `geminiService.ts`

J'ai ajouté des sections très explicites :

```typescript
⚠️ CRITICAL DISTINCTION - APPLICATION LIFECYCLE:

USE 'search_and_launch_app' ONLY FOR:
- "ouvre", "lance", "démarre"
- These verbs mean: START a NEW process

USE 'manage_window' FOR ALL OTHER WINDOW ACTIONS:
1. CLOSE: "ferme", "fermer", "close", "quit"
2. MINIMIZE: "réduis", "minimise", "minimize"
3. FOCUS: "affiche", "montre", "focus", "premier plan"
4. MAXIMIZE: "agrandis", "maximise", "maximize"
```

### Exemples Négatifs Ajoutés

```typescript
❌ WRONG:
- User: "Minimise Opera" -> search_and_launch_app (WRONG!)
- User: "Ferme Chrome" -> search_and_launch_app (WRONG!)
```

### Exemples Positifs avec Opera

```typescript
✅ CORRECT - RÉDUIRE:
- User: "Minimise Opera" -> manage_window({windowTitle: "Opera", action: "minimize"})
```

---

## 🧪 Test de Validation

**Rechargez la page** (Ctrl+F5) puis testez :

### 1. Ouvrir Opera
```
"Jarvis, ouvre opera"
```
**Attendu** : `search_and_launch_app({appName: "opera"})`

### 2. Réduire Opera
```
"Jarvis, minimise opera"
```
**Attendu** : `manage_window({windowTitle: "Opera", action: "minimize"})`

### 3. Afficher Opera
```
"Jarvis, affiche opera"
```
**Attendu** : `manage_window({windowTitle: "Opera", action: "focus"})`

### 4. Fermer Opera
```
"Jarvis, ferme opera"
```
**Attendu** : `manage_window({windowTitle: "Opera", action: "close"})`

---

## 🔍 Debug dans la Console

### ✅ Comportement CORRECT

```javascript
// Pour "minimise opera"
🧠 [BRAIN] Intent: 1 tool to execute
⚙️ [KERNEL] Executing: manage_window
   { windowTitle: "Opera", action: "minimize" }
✅ [KERNEL] Tool completed
```

### ❌ Comportement INCORRECT

```javascript
// Pour "minimise opera" (MAUVAIS)
🧠 [BRAIN] Intent: Mixed (Talk + Action)
⚙️ [KERNEL] Executing: search_and_launch_app  // ❌ ERREUR!
   { appName: "opera" }
```

Si vous voyez `search_and_launch_app` pour "minimise", c'est que Gemini n'a pas compris.

---

## 🚀 Prochaines Étapes

1. **Rechargez la page** complètement (Ctrl+F5)
2. **Testez "minimise opera"**
3. **Vérifiez la console** : doit afficher `manage_window`
4. **Si ça ne marche toujours pas** : Videz complètement le cache du navigateur

---

## 💡 Astuce

Si Gemini continue de se tromper, essayez des formulations alternatives :

Au lieu de | Essayez
-----------|--------
"minimise opera" | "réduis opera"
"ferme opera" | "ferme la fenêtre opera"
"affiche opera" | "montre opera"

Le système comprend plusieurs variantes !
