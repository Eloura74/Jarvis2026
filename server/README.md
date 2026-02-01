# Backend Node.js - J.A.R.V.I.S.

Serveur Node.js qui indexe automatiquement les applications Windows et expose une API REST pour la recherche et le lancement.

## Installation

```bash
cd server
npm install
```

## Premier lancement - Indexation

```bash
# Indexer toutes les applications Windows (première fois)
npm run scan

# Cela va scanner :
# - C:\Program Files
# - C:\Program Files (x86)
# - C:\Users\[username]\AppData\Local\Programs
# - C:\Users\[username]\AppData\Roaming

# Résultat : fichier apps-index.json créé
```

## Démarrage du serveur

```bash
# Mode production
npm start

# Mode développement (avec auto-reload)
npm run dev
```

Le serveur démarre sur **http://localhost:3001**

## API Endpoints

### GET /api/status

Statut du serveur

```json
{
  "status": "online",
  "appsCount": 142,
  "lastIndexTime": "2026-02-01T13:00:00.000Z",
  "indexing": false
}
```

### GET /api/search?q=bambu

Recherche une application

```json
{
  "query": "bambu",
  "count": 2,
  "results": [
    {
      "name": "Bambu Studio",
      "path": "C:\\Program Files\\Bambu Studio\\Bambu Studio.exe",
      "size": 52428800,
      "keywords": ["bambu", "studio"]
    }
  ]
}
```

### POST /api/launch

Lance une application

```json
// Request
{
  "path": "C:\\Program Files\\Bambu Studio\\Bambu Studio.exe"
}

// Response
{
  "success": true,
  "message": "Launched: C:\\Program Files\\Bambu Studio\\Bambu Studio.exe"
}
```

### POST /api/reindex

Force une ré-indexation

```json
{
  "success": true,
  "message": "Reindexing started"
}
```

## Utilisation avec le Frontend

Le frontend J.A.R.V.I.S. appelle automatiquement l'API pour :

1. Chercher une application : `GET /api/search?q=bambu`
2. Lancer l'application trouvée : `POST /api/launch`

## Configuration

Variables d'environnement (optionnel) :

```bash
PORT=3001  # Port du serveur (défaut: 3001)
```

## Fonctionnalités

✅ **Scan automatique** au démarrage  
✅ **Cache persistant** (apps-index.json)  
✅ **Recherche intelligente** avec scoring  
✅ **Lancement natif** des applications Windows  
✅ **CORS activé** pour le frontend  
✅ **Index rechargeable** à la demande

## Logs

Le serveur affiche des logs détaillés :

```
🚀 J.A.R.V.I.S. Backend starting...
✅ Loaded 142 apps from cache
✅ J.A.R.V.I.S. Backend running on http://localhost:3001
🔍 Searching for: "bambu"
   Found 2 results
🚀 Launching: C:\Program Files\Bambu Studio\Bambu Studio.exe
```
