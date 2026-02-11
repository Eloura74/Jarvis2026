# 🔧 Configuration des Applications - Guide Complet

## 📋 Vue d'Ensemble

J'ai créé un **système complet de configuration des chemins d'applications** qui permet de :
- ✅ Configurer les chemins des applications depuis l'interface graphique
- ✅ Gérer 20+ applications par défaut (Chrome, VSCode, Spotify, etc.)
- ✅ Ajouter/Modifier/Supprimer des applications
- ✅ Importer/Exporter la configuration en JSON
- ✅ Recherche intelligente par nom ou alias
- ✅ Sauvegarde automatique dans localStorage

---

## 🎯 Fonctionnement

### Hiérarchie de Recherche

Quand tu dis **"Ouvre Chrome"**, JARVIS cherche dans cet ordre :

1. **Configuration utilisateur** (PRIORITÉ ABSOLUE) ⭐
   - Chemins configurés dans l'interface
   - Sauvegardés dans localStorage
   
2. **Mémoire utilisateur** (fallback)
   - Applications déjà lancées
   
3. **Recherche backend** (fallback)
   - Scan du système
   
4. **Base de données locale** (fallback)
   - Liste hardcodée
   
5. **Prompt utilisateur** (dernier recours)
   - Demande manuelle du chemin

---

## 📁 Fichiers Créés

### 1. **`hooks/useAppPaths.ts`** - Hook de Gestion

**Fonctionnalités** :
```typescript
const {
  appPaths,        // Liste des applications
  findApp,         // Recherche par nom/alias
  addApp,          // Ajouter nouvelle app
  updateApp,       // Modifier app existante
  removeApp,       // Supprimer app
  resetToDefaults, // Réinitialiser
  importPaths,     // Import JSON
  exportPaths,     // Export JSON
} = useAppPaths();
```

**Applications Par Défaut** (20 apps) :
- **Navigateurs** : Chrome, Firefox, Edge
- **IDE** : VSCode, Notepad++, Sublime Text
- **Média** : Spotify, VLC
- **Productivité** : Excel, Word, PowerPoint, Outlook
- **Système** : Explorateur, Calculatrice, Bloc-notes, CMD, PowerShell
- **Autres** : Discord, Slack, Steam

**Structure Application** :
```typescript
interface AppPath {
  name: string;           // "Chrome"
  path: string;           // "C:\\Program Files\\..."
  aliases: string[];      // ["chrome", "google chrome"]
  category: 'browser' | 'ide' | 'media' | 'productivity' | 'system' | 'other';
  icon?: string;          // "🌐"
}
```

**Sauvegarde** :
- localStorage : `jarvis_app_paths`
- Chargement automatique au démarrage
- Sauvegarde automatique à chaque modification

---

### 2. **`components/AppPathsManager.tsx`** - Interface Graphique

**Interface Complète** :
- 🔍 **Barre de recherche** - Filtre par nom/alias
- 📦 **Filtres catégories** - Navigateurs, IDE, Média, etc.
- ➕ **Ajouter application** - Formulaire complet
- ✏️ **Éditer application** - Modifier inline
- 🗑️ **Supprimer application** - Confirmation
- 📥 **Importer JSON** - Upload fichier
- 📤 **Exporter JSON** - Download fichier
- 🔄 **Reset** - Retour aux défauts

**Formulaire Application** :
```
Champs obligatoires :
- Nom *              (Ex: Chrome)
- Chemin complet *   (Ex: C:\Program Files\...\chrome.exe)

Champs optionnels :
- Icône             (Ex: 🌐)
- Catégorie         (dropdown)
- Alias             (séparés par virgules)
```

**Design** :
- Panel latéral droit (slide-in)
- Style tech JARVIS (cyan/doré)
- Responsive
- Animations Framer Motion

---

### 3. **`components/PremiumLayout.tsx`** - Intégration UI

**Bouton Ajouté** :
- Position : Panneau "Time" en bas à gauche
- Label : "CONFIG APPS"
- Icône : Grille d'applications
- Ouvre le `AppPathsManager`

**Code** :
```tsx
<button
  onClick={() => setIsAppPathsOpen(true)}
  className="jarvis-button"
>
  <svg>...</svg>
  <span>CONFIG APPS</span>
</button>

<AppPathsManager
  isOpen={isAppPathsOpen}
  onClose={() => setIsAppPathsOpen(false)}
/>
```

---

### 4. **`handlers/systemHandlers.ts`** - Utilisation Backend

**Modification** :
```typescript
// ÉTAPE 0 : Configuration utilisateur (PRIORITÉ ABSOLUE) ✨
if (findAppPath) {
  const configuredApp = findAppPath(targetApp);
  if (configuredApp) {
    // ✅ Utiliser le chemin configuré directement
    foundPath = configuredApp.path;
    // Lancer l'application
    await launchAppOnBackend(foundPath);
    return { status: "success", message: `${configuredApp.name} lancé` };
  }
}
```

**Logs** :
```
✅ Using configured path for "Chrome": C:\Program Files\...
⚠️ No configured path for "unknown", falling back to search...
```

---

### 5. **`App.tsx`** - Hook Principal

**Intégration** :
```typescript
// Import hook
import { useAppPaths } from "./hooks/useAppPaths";

// Dans App component
const { findApp } = useAppPaths();

// Passer à executeTool
const additionalDeps = {
  setActiveOverlay,
  appMemory,
  updateMemory,
  findAppPath: (query: string) => findApp(query), // ✨ Nouveau
};
```

---

## 🎮 Utilisation

### 1️⃣ Ouvrir le Panneau de Configuration

**Depuis l'interface** :
1. Cliquer sur le bouton **"CONFIG APPS"** (bas-gauche)
2. Le panneau s'ouvre depuis la droite

### 2️⃣ Ajouter une Application

1. Cliquer sur **"➕ AJOUTER"**
2. Remplir le formulaire :
   ```
   Nom : Photoshop
   Chemin : C:\Program Files\Adobe\Photoshop\Photoshop.exe
   Icône : 🎨
   Catégorie : other
   Alias : photoshop, ps, adobe photoshop
   ```
3. Cliquer **"SAUVEGARDER"**
4. ✅ L'application est maintenant configurable !

### 3️⃣ Modifier une Application

1. Cliquer sur **✏️** à côté de l'app
2. Modifier les champs
3. Cliquer **"SAUVEGARDER"**

### 4️⃣ Supprimer une Application

1. Cliquer sur **🗑️** à côté de l'app
2. Confirmer la suppression

### 5️⃣ Exporter la Configuration

1. Cliquer sur **"📤 EXPORTER"**
2. Fichier `jarvis_app_paths.json` téléchargé
3. Sauvegarder pour partage/backup

### 6️⃣ Importer une Configuration

1. Cliquer sur **"📥 IMPORTER"**
2. Sélectionner fichier `.json`
3. Configuration chargée automatiquement

### 7️⃣ Réinitialiser

1. Cliquer sur **"🔄 RESET"**
2. Confirmer
3. Retour aux 20 applications par défaut

---

## 📝 Exemples de Configuration

### Exemple 1 : VSCode Portable

```json
{
  "name": "Visual Studio Code",
  "path": "D:\\PortableApps\\VSCode\\Code.exe",
  "aliases": ["vscode", "code", "vs code"],
  "category": "ide",
  "icon": "💻"
}
```

### Exemple 2 : Application Personnalisée

```json
{
  "name": "Mon Script Python",
  "path": "C:\\Users\\Me\\Documents\\script.bat",
  "aliases": ["script", "mon script"],
  "category": "other",
  "icon": "🐍"
}
```

### Exemple 3 : Jeu Steam

```json
{
  "name": "Cyberpunk 2077",
  "path": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077\\bin\\x64\\Cyberpunk2077.exe",
  "aliases": ["cyberpunk", "cp2077"],
  "category": "other",
  "icon": "🎮"
}
```

---

## 🔍 Recherche Intelligente

### Par Nom Exact
```
"Ouvre Chrome"
→ Trouve : Chrome
```

### Par Alias
```
"Lance VSCode"
→ Trouve : Visual Studio Code (alias: vscode)
```

### Par Nom Partiel (début)
```
"Ouvre Fire"
→ Trouve : Firefox
```

### Par Nom Partiel (contient)
```
"Lance calcul"
→ Trouve : Calculatrice
```

---

## 💾 Format d'Export JSON

```json
[
  {
    "name": "Chrome",
    "path": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "aliases": ["chrome", "google chrome", "navigateur"],
    "category": "browser",
    "icon": "🌐"
  },
  {
    "name": "Visual Studio Code",
    "path": "C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
    "aliases": ["vscode", "vs code", "code"],
    "category": "ide",
    "icon": "💻"
  }
]
```

---

## ⚙️ Variables d'Environnement

Tu peux utiliser **`%USERNAME%`** dans les chemins :

```
C:\Users\%USERNAME%\AppData\Roaming\Spotify\Spotify.exe
```

Sera automatiquement résolu en :
```
C:\Users\Quentin\AppData\Roaming\Spotify\Spotify.exe
```

---

## 🐛 Dépannage

### ❌ "Application ne se lance pas"

**Solutions** :
1. Vérifier le chemin est correct (copier/coller depuis explorateur)
2. Tester le chemin manuellement (Win+R → coller chemin)
3. Vérifier les permissions (admin si besoin)
4. Regarder les logs JARVIS (panneau droite)

### ❌ "Application non trouvée"

**Solutions** :
1. Vérifier les alias (ajouter plus de variantes)
2. Tester la recherche depuis le panel
3. Regarder les logs pour voir la requête exacte

### ❌ "Configuration perdue"

**Solutions** :
1. Vérifier localStorage navigateur
2. Importer backup JSON si disponible
3. Reset aux défauts puis reconfigurer

---

## 🎯 Cas d'Usage Avancés

### 1. Plusieurs Versions d'une App

```json
[
  {
    "name": "Python 3.11",
    "path": "C:\\Python311\\python.exe",
    "aliases": ["python", "python3", "py311"],
    "category": "system",
    "icon": "🐍"
  },
  {
    "name": "Python 3.9",
    "path": "C:\\Python39\\python.exe",
    "aliases": ["python39", "py39"],
    "category": "system",
    "icon": "🐍"
  }
]
```

Commande :
- `"Lance Python"` → Python 3.11 (premier trouvé)
- `"Lance Python39"` → Python 3.9 (alias spécifique)

### 2. Scripts Batch/PowerShell

```json
{
  "name": "Backup Script",
  "path": "C:\\Scripts\\backup.bat",
  "aliases": ["backup", "sauvegarde"],
  "category": "system",
  "icon": "💾"
}
```

Commande :
- `"Lance backup"` → Exécute le script

### 3. Applications Portables

```json
{
  "name": "Firefox Portable",
  "path": "D:\\PortableApps\\FirefoxPortable\\FirefoxPortable.exe",
  "aliases": ["firefox portable", "ffp"],
  "category": "browser",
  "icon": "🦊"
}
```

---

## 🔒 Sécurité

### ⚠️ Attention

- ❌ **Ne pas configurer de commandes système dangereuses** (shutdown, format, etc.)
- ✅ Toujours vérifier les chemins avant de sauvegarder
- ✅ Faire des backups réguliers (export JSON)
- ✅ Ne pas partager de chemins contenant des infos sensibles

---

## 📊 Statistiques

### Applications Par Défaut

| Catégorie | Nombre |
|-----------|--------|
| Navigateurs | 3 |
| IDE | 3 |
| Média | 2 |
| Productivité | 4 |
| Système | 5 |
| Autres | 3 |
| **TOTAL** | **20** |

---

## 🚀 Prochaines Évolutions

### Version 1.1 (Planifiée)

- [ ] Détection automatique des applications installées
- [ ] Suggestions de chemins lors de l'ajout
- [ ] Groupes d'applications (dev, gaming, work)
- [ ] Raccourcis clavier pour applications fréquentes
- [ ] Statistiques d'utilisation
- [ ] Icônes personnalisées (upload image)

---

## 💡 Astuces

### ✅ Bonne Pratique

1. **Alias multiples** - Ajoute toutes les variantes possibles
   ```
   Chrome → ["chrome", "google chrome", "navigateur", "browser"]
   ```

2. **Catégorisation** - Utilise les bonnes catégories pour le filtrage

3. **Icônes cohérentes** - Utilise des emojis pertinents

4. **Export régulier** - Sauvegarde ta config chaque semaine

5. **Test après ajout** - Vérifie que l'app se lance bien

---

## 📞 Support

### 🐛 Problème ?

1. Vérifier les logs JARVIS (panneau droite)
2. Console navigateur (F12)
3. localStorage → `jarvis_app_paths`

### 💬 Questions ?

Voir `README_COMPLET.md` ou `GUIDE_UTILISATEUR.md`

---

<div align="center">

**✨ Ton JARVIS peut maintenant lancer N'IMPORTE QUELLE application ! ✨**

**Configure une fois, utilise à vie !** 🚀

</div>
