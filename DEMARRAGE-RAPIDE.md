# 🚀 Guide de Démarrage Rapide - J.A.R.V.I.S.

## ⚠️ PROBLÈME FRÉQUENT : Commandes qui ne s'exécutent pas

Si vos commandes vocales sont reconnues mais ne lancent aucune application, c'est que **le serveur backend n'est pas démarré**.

### Symptômes
- ✅ La reconnaissance vocale fonctionne
- ✅ Gemini répond
- ❌ Mais rien ne se lance réellement
- ❌ Message d'erreur dans la console : "BACKEND OFFLINE"

---

## ✅ SOLUTION : Démarrage Complet

### Option 1 : Script Automatique (RECOMMANDÉ)

**Double-cliquez sur `start-jarvis.bat`**

Ce script va :
1. Démarrer le backend (port 3001)
2. Démarrer le frontend (port 5173)
3. Ouvrir 2 fenêtres de terminal

---

### Option 2 : Démarrage Manuel

#### Étape 1 : Démarrer le Backend
```bash
cd server
node server.js
```

Vous devriez voir :
```
✅ J.A.R.V.I.S. Backend running on http://localhost:3001
```

**IMPORTANT : Laissez cette fenêtre ouverte !**

#### Étape 2 : Démarrer le Frontend (dans un autre terminal)
```bash
npm run dev
```

Vous devriez voir :
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

#### Étape 3 : Ouvrir dans le navigateur
Ouvrez **http://localhost:5173/**

---

## 🔍 Vérification que tout fonctionne

### 1. Vérifier le Backend
Dans la console du frontend, vous devriez voir :
```
✅ Backend connecté (port 3001)
✅ Backend online - Ready to execute commands
```

### 2. Tester une commande vocale
1. Cliquez sur le micro (ou dites "Jarvis")
2. Dites : **"Ouvre le bloc-notes"**
3. Le Bloc-notes Windows devrait s'ouvrir

---

## 🛠️ Configuration des Applications

Les chemins des applications sont dans `appsDatabase.ts`.

### Vérifier/Modifier un chemin

Exemple pour Chrome :
```typescript
chrome: {
  path: "C:\\Users\\VOTRE_NOM\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
  // ...
}
```

**Remplacez `VOTRE_NOM` par votre nom d'utilisateur Windows !**

### Trouver le bon chemin

1. Cherchez l'application dans le menu Démarrer
2. Clic droit → **"Ouvrir l'emplacement du fichier"**
3. Clic droit sur l'icône → **Propriétés** → Copier le chemin

---

## 📝 Commandes Vocales Exemples

### Lancement d'applications
- "Jarvis, ouvre Chrome"
- "Lance Visual Studio Code"
- "Démarre Spotify"
- "Ouvre la calculatrice"

### Navigation Web
- "Ouvre Chrome et va sur YouTube"
- "Lance Opera et recherche Python sur YouTube"
- "Firefox avec Google"

### Visuel
- "Montre-moi une image de Mars"
- "Affiche Iron Man"

### Système
- "Quelle heure est-il ?"
- "Verrouille la session"
- "Monte le volume"

---

## ❌ Dépannage

### Le backend ne démarre pas
```
Error: Cannot find module 'express'
```

**Solution :**
```bash
cd server
npm install
```

### "Port 3001 already in use"

**Solution :**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID XXXX /F
```

### Les chemins d'applications sont incorrects

**Solution :**
Éditez `appsDatabase.ts` et corrigez les chemins selon votre installation.

---

## 🎯 Architecture du Système

```
Frontend (React)          Backend (Node.js)
Port 5173                 Port 3001
    |                          |
    |--- Reconnaissance -------|
    |    vocale (Web API)      |
    |                          |
    |--- Gemini AI -------> Analyse
    |                       commande
    |                          |
    |--- Requête HTTP -------> Lancement
    |                       application
    |<-- Résultat -------------|
```

**SANS LE BACKEND, RIEN NE PEUT ÊTRE LANCÉ SUR VOTRE PC !**

---

## 📞 Support

Si vous avez des problèmes :
1. Vérifiez que les 2 serveurs sont démarrés
2. Regardez la console du navigateur (F12)
3. Regardez les logs du backend (terminal)
4. Vérifiez les chemins dans `appsDatabase.ts`
