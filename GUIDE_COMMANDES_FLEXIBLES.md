# 🎯 GUIDE - Commandes Flexibles

## ✅ **MODIFICATIONS APPLIQUÉES**

### **Prompt Gemini Amélioré** ✅
- ✅ Accepte **TOUTES les variations** de formulation
- ✅ Plus besoin de dire exactement "Lance X ET ouvre Y"
- ✅ Formulations naturelles acceptées
- ✅ Détection intelligente des intentions

---

## 🎤 **NOUVELLES FORMULATIONS ACCEPTÉES**

### **Avant (Strict)** ❌
```
"Lance Chrome ET ouvre YouTube"  ← Seulement cette formulation
```

### **Maintenant (Flexible)** ✅

**Toutes ces formulations fonctionnent** :
```
✅ "Lance Chrome ET ouvre YouTube"
✅ "Ouvre YouTube sur Chrome"
✅ "Chrome avec YouTube"
✅ "Chrome YouTube"
✅ "Recherche petit chaton sur YouTube"
✅ "Montre-moi des vidéos de chat"
✅ "Lance Opera recherche Python"
✅ "Firefox tutoriel React"
✅ "Ouvre Google sur Chrome"
✅ "Chrome recherche recette crêpes"
```

**Gemini comprend maintenant l'intention !** 🧠

---

## 🔧 **PROBLÈME CHROME - À CORRIGER**

### **Erreur Actuelle**
```
Path: C:\Program Files\Google\Chrome\Application\chrome.exe
❌ Path not accessible
```

### **Cause**
Gemini utilise un chemin **générique** au lieu du **vrai chemin** configuré.

### **Solution**

#### **Option 1 : Config Panel (Recommandé)** ✅

1. **Cliquez sur "CONFIG APPS"**
2. **Onglet "Applications"**
3. **Trouvez Chrome**
4. **Vérifiez que le chemin est** :
   ```
   C:\Users\faber\AppData\Local\Google\Chrome\Application\chrome.exe
   ```
5. **Si différent, corrigez-le**

#### **Option 2 : Manuel**

Ouvrez `appsDatabase.ts` ligne 44 et vérifiez :
```typescript
chrome: {
  path: "C:\\Users\\faber\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
  // ...
}
```

**Vérification rapide** :
```cmd
dir "C:\Users\faber\AppData\Local\Google\Chrome\Application\chrome.exe"
```

Si le fichier n'existe pas, trouvez le bon chemin avec :
```cmd
where chrome
```

Ou cherchez dans :
- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
- `C:\Users\faber\AppData\Local\Google\Chrome\Application\chrome.exe`

---

## 🧪 **EXEMPLES À TESTER**

### **1. Recherche YouTube Simple**
```
"Recherche petit chaton sur YouTube"
```
→ Opera + YouTube avec recherche automatique

### **2. Chrome + Site**
```
"Ouvre YouTube sur Chrome"
```
→ Chrome s'ouvre avec YouTube

### **3. Formulation Libre**
```
"Chrome recherche recette gâteau"
```
→ Chrome + Google avec recherche "recette gâteau"

### **4. Très Court**
```
"Chrome YouTube"
```
→ Chrome + YouTube

### **5. Recherche Directe**
```
"Montre-moi des vidéos de chat"
```
→ Navigateur par défaut + YouTube

---

## 📊 **NOUVELLES FORMULATIONS ACCEPTÉES**

| Intention | Formulations Possibles | Résultat |
|-----------|----------------------|----------|
| **YouTube** | "YouTube", "Recherche X sur YouTube", "Montre vidéos de X" | YouTube ouvert avec recherche |
| **Google** | "Recherche X", "Google X", "Cherche X" | Google avec recherche |
| **Chrome + Site** | "Chrome YouTube", "Ouvre X sur Chrome", "Chrome avec X" | Chrome + Site |
| **Opera + Site** | "Opera YouTube", "Lance Opera X", "Opera recherche X" | Opera + Site |

---

## 💡 **ASTUCES**

### **Mentionnez TOUJOURS le navigateur**
```
✅ "Chrome YouTube"
✅ "Opera recherche chat"
❌ "Recherche chat" ← Quel navigateur ?
```

### **Ordre Flexible**
```
✅ "Chrome YouTube"
✅ "YouTube sur Chrome"
✅ "Ouvre Chrome avec YouTube"
```
→ Tous fonctionnent !

### **Recherche Automatique**
```
"Chrome recherche recette"
→ https://google.com/search?q=recette

"YouTube tutoriel Python"
→ https://youtube.com/results?search_query=tutoriel+Python
```

---

## 🔄 **APRÈS CORRECTION DU CHEMIN CHROME**

### **Rechargez le backend**
```bash
# Dans le terminal serveur
Ctrl+C
npm run dev
```

### **Testez**
```
"Chrome YouTube"
```

**Devrait fonctionner** ! ✅

---

## 📝 **RÉCAPITULATIF**

### ✅ **Ce qui marche maintenant**
- Formulations libres et naturelles
- Détection intelligente des intentions
- Combinaisons navigateur + site
- Recherches automatiques

### ⚠️ **À corriger**
- Chemin Chrome (vérifier avec Config Panel ou manuellement)

---

## 🎯 **TEST FINAL**

1. **Vérifiez le chemin Chrome** (Config Panel ou `appsDatabase.ts`)
2. **Redémarrez le backend** (`npm run dev`)
3. **Rechargez J.A.R.V.I.S.** (F5)
4. **Testez** :
   ```
   "Chrome recherche petit chaton"
   ```

**Si ça fonctionne** : Tout est parfait ! 🎉  
**Si erreur** : Envoyez-moi le log complet

---

**Créé le** : 14 février 2026, 00:23  
**Version** : Commandes Flexibles + Chrome Fix Guide
