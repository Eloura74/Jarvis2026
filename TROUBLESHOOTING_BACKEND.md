# 🐛 Troubleshooting Backend - Crash après lancements

## Problème Observé

**Symptômes** :

- ✅ Premier lancement : Notepad → **OK**
- ✅ Deuxième lancement : Bambu Studio → **OK**
- ❌ Troisième lancement et suivants : **Rien ne se lance**

**Hypothèses** :

1. Le serveur Node.js crash silencieusement après 2-3 lancements
2. Les processus child spawn ne se détachent pas correctement
3. Memory leak ou event loop bloqué
4. Erreur non catchée qui crash le serveur

---

## Diagnostic Recommandé

### 1. Vérifier si le serveur tourne toujours

```cmd
# PowerShell
Get-Process -Name node

# Si le serveur est mort, le relancer
cd A:\_PROJETS\Jarvis2026\server
node server.js
```

### 2. Vérifier les logs serveur

Regarder la console où `node server.js` tourne :

- Y a-t-il des erreurs après le 2e lancement ?
- Des warnings sur les event listeners ?
- Des exceptions non catchées ?

### 3. Tester l'endpoint directement

```bash
# Tester si le backend répond
curl http://localhost:3001/api/status

# Si timeout ou erreur de connexion → serveur crashé
```

---

## Solutions Proposées

### Solution 1 : Améliorer la Gestion des Erreurs (RECOMMANDÉ)

Problème identifié : Le `spawn()` peut crasher le serveur si l'exécutable est invalide ou si le processus child échoue.

**Fix** : Ajouter error handlers robustes sur les child processes.

### Solution 2 : Ajouter Logging Détaillé

Ajouter des logs avant/après chaque étape critique pour identifier exactement où ça crash.

### Solution 3 : Process Manager (PM2)

Utiliser PM2 pour auto-restart si le serveur crash :

```bash
npm install -g pm2
pm2 start server/server.js --name jarvis-backend
pm2 logs jarvis-backend
```

---

## Fix Immédiat

Je vais améliorer le code de `server.js` pour :

1. ✅ Ajouter error handler sur le child process
2. ✅ Logger chaque étape du lancement
3. ✅ Catch toutes les exceptions non gérées
4. ✅ Vérifier que le path existe avant spawn

---

## Test de Validation

Après fix :

1. Relancer le serveur
2. Tester 5+ lancements consécutifs
3. Vérifier que le serveur reste stable
4. Monitorer les logs pour des erreurs

---

**Statut** : 🔨 En cours de correction...
