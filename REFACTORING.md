# 🔧 JARVIS 2026 - PLAN DE REFACTORING

**Objectif** : Tous les fichiers doivent faire **moins de 400 lignes**.

---

## 📊 AUDIT FICHIERS >400 LIGNES

### Méthode d'audit
```bash
# Commande pour lister les fichiers >400 lignes
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  grep -v node_modules | grep -v dist | grep -v build | \
  xargs wc -l | sort -rn | awk '$1 > 400'
```

### Fichiers identifiés (à auditer manuellement)

**Candidats probables** (basé sur complexité fonctionnelle) :
- `appsDatabase.ts` (~390 lignes) - proche limite
- `hooks/useJarvisInteraction.ts` - logique interaction complexe
- `hooks/useJarvisBrain.ts` - orchestration Gemini
- `services/geminiService.ts` - appels API Gemini
- `components/SearchResultsOverlay.tsx` - overlay recherche
- Fichiers backend `server/*.js` - à vérifier

---

## 🎯 STRATÉGIE DE FACTORISATION

### Principe SOLID
- **S**ingle Responsibility : 1 fichier = 1 responsabilité
- **O**pen/Closed : Extension sans modification
- **L**iskov Substitution : Interfaces cohérentes
- **I**nterface Segregation : Pas de dépendances inutiles
- **D**ependency Inversion : Dépendre d'abstractions

### Règles de factorisation
1. **Max 400 lignes** par fichier (strict)
2. **Max 50 lignes** par fonction (recommandé)
3. **Max 5 paramètres** par fonction
4. **Pas de code dupliqué** (DRY - Don't Repeat Yourself)
5. **Nommage explicite** (pas de `temp`, `data`, `handle`)

---

## 📁 PLAN DE FACTORISATION PAR MODULE

### 1. `appsDatabase.ts` (390 lignes)
**Problème** : Base de données + logique de recherche dans même fichier

**Solution** :
```
apps/
  ├── database.ts          # Uniquement APPS_DATABASE (200 lignes)
  ├── search.ts            # Fonction searchApps (100 lignes)
  ├── categories.ts        # Fonction getAppsByCategory (50 lignes)
  └── types.ts             # Interface AppEntry (40 lignes)
```

**Bénéfices** :
- Séparation données/logique
- Ajout facile de nouvelles apps
- Tests unitaires par module

---

### 2. `hooks/useJarvisInteraction.ts`
**Problème** : Gestion wake word + commandes + watchdog + état

**Solution** :
```
hooks/interaction/
  ├── useJarvisInteraction.ts   # Orchestration principale (150 lignes)
  ├── useWakeWordManager.ts     # Gestion wake word (100 lignes)
  ├── useCommandValidator.ts    # Validation commandes (80 lignes)
  ├── useWatchdog.ts            # Watchdog statuts bloqués (70 lignes)
  └── types.ts                  # Types partagés (50 lignes)
```

---

### 3. `hooks/useJarvisBrain.ts`
**Problème** : Appels Gemini + gestion tools + streaming + historique

**Solution** :
```
hooks/brain/
  ├── useJarvisBrain.ts         # Orchestration (150 lignes)
  ├── useGeminiStream.ts        # Gestion streaming (100 lignes)
  ├── useToolExecutor.ts        # Déjà séparé ✅
  ├── useConversationHistory.ts # Gestion historique (80 lignes)
  └── types.ts                  # Types brain (50 lignes)
```

---

### 4. `services/geminiService.ts`
**Problème** : Appels API + cache + rate limiting + parsing

**Solution** :
```
services/gemini/
  ├── client.ts                 # Client API Gemini (150 lignes)
  ├── cache.ts                  # Déjà séparé (geminiCache.ts) ✅
  ├── rateLimiter.ts            # Déjà séparé ✅
  ├── parser.ts                 # Parsing réponses (100 lignes)
  ├── systemPrompt.ts           # Déjà séparé ✅
  └── types.ts                  # Types Gemini (50 lignes)
```

---

### 5. `components/SearchResultsOverlay.tsx`
**Problème** : Overlay + thumbnails + animations + gestion clics

**Solution** :
```
components/SearchResults/
  ├── SearchResultsOverlay.tsx  # Container principal (150 lignes)
  ├── ResultThumbnail.tsx       # Composant thumbnail (100 lignes)
  ├── ResultCard.tsx            # Card résultat (80 lignes)
  ├── animations.ts             # Variants Framer Motion (70 lignes)
  └── types.ts                  # Types overlay (50 lignes)
```

---

### 6. Backend `server/*.js`
**À auditer** :
- `server/server.js` - point d'entrée
- `server/routes/*.js` - routes API
- `server/windowManager.js` - gestion fenêtres
- `server/services/*.js` - services backend

**Principe** :
```
server/
  ├── server.js                 # Bootstrap (<150 lignes)
  ├── routes/
  │   ├── index.js              # Router principal (<100 lignes)
  │   ├── windows.js            # Routes fenêtres (<150 lignes)
  │   ├── web.js                # Routes web (<150 lignes)
  │   └── ...
  ├── services/
  │   ├── windowManager/
  │   │   ├── index.js          # Export principal (<50 lignes)
  │   │   ├── finder.js         # Recherche fenêtres (<150 lignes)
  │   │   ├── actions.js        # Actions (close/minimize) (<150 lignes)
  │   │   └── utils.js          # Utilitaires (<100 lignes)
  │   └── ...
  └── middleware/
      ├── validation.js         # Validation inputs (<150 lignes)
      ├── rateLimiter.js        # Rate limiting (<100 lignes)
      └── errorHandler.js       # Gestion erreurs (<100 lignes)
```

---

## 🔒 SÉCURITÉ BACKEND

### 1. Validation Inputs (Zod)
```typescript
// server/middleware/validation.ts
import { z } from 'zod';

const windowTitleSchema = z.object({
  windowTitle: z.string().min(1).max(200),
  action: z.enum(['close', 'minimize', 'maximize', 'focus'])
});

export const validateWindowAction = (req, res, next) => {
  try {
    windowTitleSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error.errors });
  }
};
```

### 2. Rate Limiting
```typescript
// server/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Too many requests, please try again later.'
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requêtes par minute (routes sensibles)
});
```

### 3. CORS Strict
```typescript
// server/middleware/cors.ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173', // Vite dev
  'http://localhost:3000', // Production locale
  // Ajouter domaine production si déployé
];

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
```

### 4. Sanitization
```typescript
// server/middleware/sanitize.ts
import validator from 'validator';

export const sanitizeString = (str: string): string => {
  return validator.escape(validator.trim(str));
};

export const sanitizeBody = (req, res, next) => {
  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === 'string') {
      req.body[key] = sanitizeString(req.body[key]);
    }
  });
  next();
};
```

### 5. Secrets Management
```typescript
// server/config/secrets.ts
import dotenv from 'dotenv';

dotenv.config();

// Validation secrets obligatoires
const requiredSecrets = [
  'GEMINI_API_KEY',
  'GOOGLE_MAPS_API_KEY',
  'OPENWEATHER_API_KEY',
];

requiredSecrets.forEach(secret => {
  if (!process.env[secret]) {
    throw new Error(`Missing required secret: ${secret}`);
  }
});

export const secrets = {
  gemini: process.env.GEMINI_API_KEY!,
  googleMaps: process.env.GOOGLE_MAPS_API_KEY!,
  openWeather: process.env.OPENWEATHER_API_KEY!,
  // Jamais exposer côté client
};
```

### 6. HTTPS Production
```typescript
// server/https.ts
import https from 'https';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

export const createServer = (app) => {
  if (isProduction) {
    const options = {
      key: fs.readFileSync('/etc/letsencrypt/live/domain.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/domain.com/fullchain.pem'),
    };
    return https.createServer(options, app);
  }
  return app; // HTTP en dev
};
```

---

## 📋 CHECKLIST REFACTORING

### Avant de factoriser un fichier
- [ ] Lire le fichier complet
- [ ] Identifier les responsabilités distinctes
- [ ] Dessiner l'architecture cible
- [ ] Créer les nouveaux fichiers vides
- [ ] Déplacer le code par blocs logiques
- [ ] Mettre à jour les imports
- [ ] Tester que tout fonctionne
- [ ] Supprimer l'ancien fichier si vide

### Après factorisation
- [ ] Vérifier aucun fichier >400 lignes
- [ ] Vérifier aucune fonction >50 lignes
- [ ] Vérifier pas de code dupliqué
- [ ] Vérifier imports cohérents
- [ ] Tester toutes les fonctionnalités
- [ ] Commit avec message explicite

---

## 🎯 PRIORITÉS REFACTORING

### Phase 1 (Urgent)
1. `appsDatabase.ts` - Séparer données/logique
2. Backend security - Ajouter validation/rate limiting
3. `server/windowManager.js` - Factoriser si >400 lignes

### Phase 2 (Important)
4. `hooks/useJarvisInteraction.ts` - Séparer responsabilités
5. `hooks/useJarvisBrain.ts` - Factoriser orchestration
6. `services/geminiService.ts` - Séparer client/parser

### Phase 3 (Amélioration)
7. `components/SearchResultsOverlay.tsx` - Composants séparés
8. Autres fichiers >400 lignes identifiés
9. Audit complet architecture

---

**Dernière mise à jour** : 24 février 2026, 01:10
**Statut** : Audit en cours
