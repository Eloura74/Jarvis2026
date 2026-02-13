# 🚀 Guide d'Installation des Améliorations

Ce document explique comment installer et configurer les nouvelles fonctionnalités ajoutées à Jarvis2026.

---

## 📦 Nouvelles Fonctionnalités Implémentées

### ✅ 1. Widget Météo Dynamique (OpenWeatherMap API)
- Affichage de la météo en temps réel
- Géolocalisation automatique
- Rafraîchissement toutes les 10 minutes
- Icônes dynamiques selon conditions

### ✅ 2. Stats Système Réelles
- Monitoring CPU, RAM, Réseau en temps réel
- Backend avec API dédiée
- Rafraîchissement toutes les 2 secondes
- Support température CPU (si disponible)

### ✅ 3. Persistance de l'Historique
- Sauvegarde automatique dans localStorage
- Conservation de 50 derniers messages
- Export/Import des conversations
- Survit aux rechargements de page

### ✅ 4. Layout Full Responsive
- Support mobile (< 768px)
- Support tablette (768px - 1280px)
- Support desktop (> 1280px)
- Grid adaptatif 1/2/3 colonnes

---

## 🔧 Installation Étape par Étape

### **Étape 1 : Installation des dépendances backend**

```bash
cd server
npm install
```

Cela installera notamment **`systeminformation`** pour les stats système.

### **Étape 2 : Configuration des variables d'environnement**

1. **Créer le fichier `.env.local`** à la racine du projet :

```bash
# Depuis la racine du projet
copy .env.example .env.local
```

2. **Configurer les clés API** dans `.env.local` :

```env
# === GEMINI AI (Déjà configuré normalement) ===
VITE_GEMINI_API_KEY=votre_clé_gemini_existante

# === OPENWEATHERMAP API (NOUVEAU) ===
VITE_OPENWEATHER_API_KEY=VOTRE_CLÉ_OPENWEATHER

# === HOME ASSISTANT (Optionnel) ===
VITE_HA_TOKEN=votre_token_ha
```

### **Étape 3 : Obtenir une clé API OpenWeatherMap**

1. Aller sur [https://openweathermap.org/api](https://openweathermap.org/api)
2. Créer un compte gratuit
3. Aller dans **"API Keys"** de votre profil
4. Copier votre clé API
5. Coller dans `.env.local` : `VITE_OPENWEATHER_API_KEY=votre_clé_ici`

**Note** : Le plan gratuit permet **1000 appels/jour** (largement suffisant).

### **Étape 4 : Démarrer le backend**

```bash
cd server
npm start
```

Le serveur démarrera sur **`http://localhost:3001`** avec les nouveaux endpoints :
- `GET /api/system/stats` - Stats système complètes
- `GET /api/system/stats/light` - Stats légères (optimisé polling)

### **Étape 5 : Démarrer le frontend**

```bash
# Depuis la racine du projet
npm run dev
```

Le frontend démarrera sur **`http://localhost:5173`** (ou port Vite par défaut).

---

## 📱 Responsive Design - Breakpoints

| Appareil | Largeur | Layout |
|----------|---------|--------|
| **Mobile** | < 768px | 1 colonne verticale |
| **Tablette** | 768px - 1279px | 2 colonnes (gauche + centre) |
| **Desktop** | ≥ 1280px | 3 colonnes (gauche + centre + droite) |

### Ordre d'affichage Mobile :
1. Colonne gauche (stats, widgets)
2. Centre (HUD, micro)
3. Colonne droite (heure, chat)

---

## 🧪 Vérification du Fonctionnement

### **1. Widget Météo**

✅ **OK** : Affiche température, ville, conditions actuelles  
❌ **Erreur** : "Météo indisponible"

**Solutions** :
- Vérifier que `VITE_OPENWEATHER_API_KEY` est définie dans `.env.local`
- Vérifier la clé API sur [openweathermap.org](https://openweathermap.org)
- Autoriser la géolocalisation dans le navigateur
- Ouvrir la console (F12) pour voir les erreurs détaillées

### **2. Stats Système**

✅ **OK** : CPU, RAM, Processus affichent des valeurs réelles  
❌ **Erreur** : Valeurs à 0 ou pas de mise à jour

**Solutions** :
- Vérifier que le backend est démarré (`npm start` dans `/server`)
- Ouvrir `http://localhost:3001/api/system/stats/light` dans le navigateur
- Vérifier les logs du serveur backend
- Si erreur 404 : vérifier que `systeminformation` est installé

### **3. Persistance Historique**

✅ **OK** : L'historique survit au rechargement (F5)  
❌ **Erreur** : Historique vide après rechargement

**Solutions** :
- Ouvrir les DevTools (F12) → Application → Local Storage
- Vérifier la présence de `jarvis_conversation_history`
- Si absent : vérifier la console pour erreurs localStorage
- Mode navigation privée désactive localStorage

### **4. Responsive Design**

✅ **OK** : Layout s'adapte à la taille de la fenêtre  
❌ **Erreur** : Layout cassé ou débordement

**Solutions** :
- Vider le cache du navigateur (Ctrl+Shift+R)
- Tester en mode responsive des DevTools (F12)
- Vérifier que Tailwind CSS est compilé

---

## 🐛 Dépannage Commun

### Problème : Backend ne démarre pas

**Erreur** : `Error: Cannot find module 'systeminformation'`

**Solution** :
```bash
cd server
npm install systeminformation
```

### Problème : Widget météo affiche "Config API manquante"

**Cause** : Clé API OpenWeatherMap non définie

**Solution** :
1. Vérifier `.env.local` à la racine (pas dans `/server`)
2. Préfixe **`VITE_`** obligatoire pour variables frontend
3. Redémarrer le serveur Vite après modification `.env.local`

### Problème : Stats système toujours à 0

**Cause** : Backend offline ou erreur API

**Solution** :
```bash
# Tester l'endpoint directement
curl http://localhost:3001/api/system/stats/light

# Si erreur 404 : backend pas démarré
cd server
npm start

# Si erreur 500 : vérifier logs serveur
```

### Problème : Layout responsive ne fonctionne pas

**Cause** : Cache CSS ou Tailwind pas recompilé

**Solution** :
```bash
# Redémarrer Vite
npm run dev

# Forcer rechargement sans cache
# Dans navigateur : Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)
```

---

## 📊 Architecture des Nouveaux Modules

```
jarvis2026/
├── services/
│   └── weatherService.ts          # Service météo OpenWeatherMap
├── server/
│   ├── systemStats.js              # Récupération stats système
│   └── server.js                   # Routes API ajoutées
├── hooks/
│   ├── useSystemStats.ts           # Hook stats réelles (vs simulées)
│   └── useConversationMemory.ts    # Hook avec persistance localStorage
├── components/
│   ├── WeatherWidget.tsx           # Widget météo dynamique
│   └── PremiumLayout.tsx           # Layout responsive
└── .env.local                      # Configuration API (à créer)
```

---

## 🔄 Mise à Jour depuis Version Précédente

Si vous avez une version antérieure de Jarvis2026 :

1. **Sauvegarder vos modifications** :
   ```bash
   git stash
   ```

2. **Installer nouvelles dépendances** :
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Copier `.env.local`** si absent :
   ```bash
   copy .env.example .env.local
   ```

4. **Redémarrer les serveurs** :
   ```bash
   # Terminal 1 (Backend)
   cd server
   npm start
   
   # Terminal 2 (Frontend)
   npm run dev
   ```

---

## ⚙️ Configuration Avancée

### Modifier l'URL du Backend

Par défaut, le frontend se connecte à `http://localhost:3001`.

Pour changer (ex: déploiement) :

```env
# Dans .env.local
VITE_API_URL=https://votre-backend.com
```

### Modifier la Fréquence de Rafraîchissement

**Stats Système** :  
Fichier : `hooks/useSystemStats.ts`  
Ligne 80 : `setInterval(fetchStats, 2000);` → Changer `2000` (en ms)

**Météo** :  
Fichier : `components/WeatherWidget.tsx`  
Ligne 45 : `10 * 60 * 1000` → Changer durée (actuellement 10 min)

### Désactiver la Géolocalisation Météo

Pour utiliser une ville fixe au lieu de la géolocalisation :

```typescript
// Dans WeatherWidget.tsx, remplacer ligne 31
const data = await getWeatherByCity("Paris"); // Au lieu de getCurrentWeather()
```

---

## 📝 Endpoints API Backend

### **GET `/api/system/stats`**
Statistiques système complètes (CPU, RAM, Réseau, Processus, Température)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "cpu": 24.5,
    "memoryPercent": 65.2,
    "memoryGB": 10.4,
    "processes": 287,
    "network": {
      "download": 125.3,
      "upload": 45.2,
      "interface": "Wi-Fi"
    },
    "cpuDetails": {
      "average": 0.45,
      "cores": 8,
      "temperature": 52
    },
    "topProcesses": [...],
    "system": {...},
    "timestamp": 1707858000000
  }
}
```

### **GET `/api/system/stats/light`**
Version légère optimisée pour polling fréquent

**Réponse** :
```json
{
  "success": true,
  "data": {
    "cpu": 24.5,
    "memoryPercent": 65.2,
    "memoryGB": 10.4,
    "processes": 287,
    "timestamp": 1707858000000
  }
}
```

---

## 🎯 Prochaines Étapes Suggérées

Consultez **`AMELIORATIONS.md`** pour la liste complète des améliorations possibles :

- Système de thèmes (Iron Man, Matrix, Ultron)
- Commandes vocales composées
- Analyse visuelle avec Gemini Vision
- Explorateur de fichiers intégré
- Calendrier Google Calendar
- Et 20+ autres fonctionnalités...

---

## 💬 Support

En cas de problème :

1. **Vérifier les logs** :
   - Console navigateur (F12)
   - Logs serveur backend (terminal)

2. **Vérifier la configuration** :
   - `.env.local` existe et contient les clés API
   - Backend est démarré (`http://localhost:3001/api/status`)

3. **Tester les endpoints** :
   ```bash
   # Stats système
   curl http://localhost:3001/api/system/stats/light
   
   # Status serveur
   curl http://localhost:3001/api/status
   ```

---

**Version** : 13 février 2026  
**Auteur** : Cascade AI  
**Projet** : Jarvis2026 Enhanced
