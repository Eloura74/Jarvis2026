# 🔧 Solutions aux Erreurs Rencontrées

## ❌ **Problèmes Actuels**

### 1. ⚠️ Météo : Erreur 401 (Unauthorized)
### 2. ⚠️ Gemini : Erreur 429 (Rate Limit)
### 3. ⚠️ Backend : Erreur 404 sur /api/launch
### 4. ⚠️ Multi-commandes : Fonctionne avec Chrome mais pas d'autres navigateurs

---

## ✅ **SOLUTION 1 : Météo 401**

### Problème
```
api.openweathermap.org: 401 (Unauthorized)
```

### Cause
La clé API OpenWeatherMap n'est **pas encore activée**.

### Solution

**Option A** : **Attendre l'activation** (10 min - 2h)
- Les nouvelles clés OpenWeatherMap prennent du temps à s'activer
- Rechargez la page toutes les 10 minutes
- Testez avec : `https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=VOTRE_CLÉ&units=metric`

**Option B** : **Utiliser une ville fixe sans API**
Si vous voulez ignorer la météo pour l'instant, commentez le widget :

```typescript
// Dans PremiumLayout.tsx, commenter temporairement :
/*
<motion.div ...>
  <WeatherWidget />
</motion.div>
*/
```

---

## ✅ **SOLUTION 2 : Gemini 429 (URGENT)**

### Problème
```
ApiError: code 429 - Resource exhausted
```

### Cause
**Trop de requêtes Gemini en peu de temps.**

Le plan gratuit Gemini Flash permet :
- **15 requêtes par minute**
- **1500 requêtes par jour**

Vous avez dépassé la limite.

### Solution Immédiate

**1. ATTENDRE 1 MINUTE** entre chaque commande vocale
**2. Ne pas spam de commandes**

### Solution Permanente

Ajoutez un **rate limiter** dans le code :

```typescript
// Dans services/geminiService.ts, ajouter au début :

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 4000; // 4 secondes minimum entre requêtes

export const parseCommand = async (input: string, ...) => {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏱️ Rate limit: attendre ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  
  // ... reste du code
};
```

**⏱️ Pour l'instant : PATIENTEZ 1 HEURE** pour que les quotas se réinitialisent.

---

## ✅ **SOLUTION 3 : Backend 404**

### Problème
```
Failed to load resource: 404 (Not Found) - /api/launch
```

### Cause
**Le serveur backend n'est PAS démarré.**

### Solution

**Ouvrir un nouveau terminal et démarrer le backend :**

```bash
cd a:\02-PROJECTS\Jarvis2026\server
npm start
```

Vous devriez voir :
```
✅ J.A.R.V.I.S. Backend running on http://localhost:3001
📡 Available endpoints:
   POST /api/launch              - Launch app
   ...
```

**Gardez ce terminal ouvert !**

### Vérification

Testez dans le navigateur :
```
http://localhost:3001/api/status
```

Si ça affiche du JSON → Backend OK ✅  
Si erreur → Backend pas démarré ❌

---

## ✅ **SOLUTION 4 : Multi-commandes avec Autres Navigateurs**

### Problème
"Lance Chrome ET ouvre YouTube" fonctionne, mais pas avec Opera/Firefox.

### Cause
Les chemins des navigateurs dans `appsDatabase.ts` sont peut-être incorrects.

### Solution

**Vérifier les chemins des navigateurs :**

```typescript
// Dans appsDatabase.ts

opera: {
  path: "C:\\Users\\faber\\AppData\\Local\\Programs\\Opera\\opera.exe",
  // ⚠️ Vérifier si ce chemin existe vraiment !
},

firefox: {
  path: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
  // ⚠️ Vérifier si ce chemin existe !
},
```

**Méthode de vérification :**

1. Ouvrir l'Explorateur Windows
2. Aller dans `C:\Users\faber\AppData\Local\Programs\Opera\`
3. Vérifier que `opera.exe` existe

**Si le chemin est différent :**

Modifiez dans `appsDatabase.ts` avec le bon chemin, par exemple :
```typescript
opera: {
  path: "C:\\Program Files\\Opera\\launcher.exe", // Chemin corrigé
  ...
},
```

**Tester le lancement manuel :**

```
"Lance Opera"
```

Si ça fonctionne → Le problème est résolu  
Si erreur → Le chemin est toujours incorrect

---

## 🆕 **NOUVELLES FONCTIONNALITÉS AJOUTÉES**

### 1. ✅ Commandes Vocales Composées
**Exemples qui fonctionnent maintenant :**
```
"Lance Chrome ET ouvre YouTube"
"Lance VSCode et montre-moi un chat"
"Montre-moi un chat et un chien"
```

**Note** : Attendez 1 minute entre commandes (limitation Gemini 429)

---

### 2. ✅ Gemini Vision - Analyse d'Écran

**IMPORTANT** : Actuellement en erreur 429, attendez la réinitialisation des quotas.

**Commandes disponibles :**
```
"Analyse mon écran"
"Lis ce que tu vois"  
"Trouve les erreurs"
"Décris cette interface"
```

**Note** : Capture seulement la fenêtre du navigateur, pas le desktop complet.

---

### 3. ✅ Explorateur de Fichiers Visuel

**Comment l'ouvrir :**
1. Cliquer sur le bouton **"FICHIERS"** (colonne droite)
2. Un explorateur moderne s'ouvre

**Fonctionnalités :**
- ✅ Navigation dans les dossiers
- ✅ Recherche de fichiers
- ✅ Accès rapide (Bureau, Documents, Téléchargements)
- ✅ Aperçu des tailles de fichiers
- ✅ Icônes par type de fichier

**Prérequis** : Le backend doit être démarré !

---

## 📋 **CHECKLIST DE DÉMARRAGE**

Pour que **tout fonctionne** :

### ✅ **Terminal 1 : Backend**
```bash
cd a:\02-PROJECTS\Jarvis2026\server
npm start
```
**Laisser tourner** ✅

### ✅ **Terminal 2 : Frontend**
```bash
cd a:\02-PROJECTS\Jarvis2026
npm run dev
```
**Laisser tourner** ✅

### ✅ **Clés API configurées**

Dans `.env.local` :
```env
VITE_GEMINI_API_KEY=votre_clé_gemini
VITE_OPENWEATHER_API_KEY=votre_clé_openweather (attendre activation)
VITE_DEFAULT_WEATHER_CITY=Istres
```

### ✅ **Attendre les quotas Gemini**
- Actuellement : 429 (limite atteinte)
- **Attendre 1 heure** avant de retester
- Utiliser **maximum 1 commande par 5 secondes**

---

## 🎯 **ORDRE DES ACTIONS**

### 1. **Maintenant (Immédiat)**
```bash
# Terminal 1
cd server
npm start
# GARDER OUVERT

# Terminal 2 (nouveau)
cd ..
npm run dev
# GARDER OUVERT
```

### 2. **Tester l'explorateur**
- Cliquer sur "FICHIERS" dans l'interface
- Vérifier que ça fonctionne ✅

### 3. **Dans 1 heure (quotas Gemini réinitialisés)**
- Tester : "Lance Chrome"
- Tester : "Lance Chrome ET ouvre YouTube"
- Tester : "Analyse mon écran"

### 4. **Dans 1-2 heures (clé OpenWeatherMap activée)**
- Recharger la page
- La météo devrait s'afficher automatiquement ✅

---

## 🐛 **Si Problèmes Persistent**

### Backend ne démarre pas
```bash
cd server
npm install  # Réinstaller dépendances
npm start
```

### Frontend erreur
```bash
npm install  # Réinstaller dépendances
npm run dev
```

### Gemini toujours 429
**ARRÊTER D'ENVOYER DES COMMANDES !**  
Attendez vraiment 1 heure complète.

---

## 📞 **Status Check**

**Backend** : http://localhost:3001/api/status  
**Frontend** : http://localhost:5173  
**Stats** : http://localhost:3001/api/system/stats/light  
**Fichiers** : http://localhost:3001/api/files/quick-access

---

**Créé le** : 13 février 2026, 23:15  
**Projet** : Jarvis2026 Enhanced
