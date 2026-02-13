# 📸 GUIDE - Gemini Vision (Analyse d'Écran)

## ✅ **VISION CORRIGÉE**

La capture d'écran fonctionne maintenant avec l'API moderne `getDisplayMedia` du navigateur.

---

## 🎯 **COMMENT UTILISER**

### **1. Commande Vocale**

Dites simplement :
```
"Analyse l'écran"
"Lis ce que tu vois"
"Trouve les erreurs"
"Décris cette interface"
```

### **2. Ce qui va se passer**

1. **Permission demandée** : Une popup du navigateur apparaît
   ```
   ┌──────────────────────────────────────┐
   │  localhost veut partager votre écran │
   │                                      │
   │  [Écran complet]  [Fenêtre]  [Onglet]│
   │                                      │
   │  [Annuler]              [Partager]   │
   └──────────────────────────────────────┘
   ```

2. **Choisissez** :
   - **Écran complet** : Analyse tout votre écran
   - **Fenêtre** : Analyse une fenêtre spécifique
   - **Onglet** : Analyse un onglet du navigateur

3. **Cliquez "Partager"**

4. **Gemini analyse** :
   - Screenshot capturé
   - Envoyé à Gemini Vision
   - Résultat affiché dans les logs

---

## 🔥 **TYPES D'ANALYSE**

### **Analyse Générale** (par défaut)
```
"Analyse l'écran"
```
→ Description générale du contenu visible

### **OCR - Extraction de Texte**
```
"Lis le texte à l'écran"
```
→ Extrait tout le texte visible

### **Détection d'Erreurs**
```
"Trouve les erreurs"
```
→ Cherche les messages d'erreur, bugs, problèmes

### **Analyse d'Interface**
```
"Décris cette interface"
```
→ Analyse UI/UX, design, disposition

### **Analyse de Code**
```
"Analyse ce code"
```
→ Revue de code, suggestions d'amélioration

---

## ⚠️ **IMPORTANT**

### **Permissions**
- Le navigateur demandera **TOUJOURS** la permission
- C'est normal et **nécessaire** pour la sécurité
- Vous devez cliquer "Partager" à chaque analyse

### **Limites**
- La capture prend ~1 seconde
- Gemini Vision a les mêmes limites que Gemini Flash :
  - **15 requêtes/minute** (gratuit)
  - Si vous dépassez → Erreur 429

### **Confidentialité**
- Le screenshot est envoyé à Gemini (Google)
- **Ne capturez PAS d'informations sensibles** (mots de passe, données bancaires, etc.)

---

## 🧪 **TESTER MAINTENANT**

### **Test Simple**

1. **Ouvrez une page web** (Wikipedia, YouTube, etc.)
2. **Dites** : `"Analyse l'écran"`
3. **Autorisez** le partage d'écran
4. **Choisissez** "Onglet" et sélectionnez l'onglet actuel
5. **Attendez** le résultat dans les logs

### **Test OCR**

1. **Ouvrez un document texte** ou un site avec du texte
2. **Dites** : `"Lis le texte à l'écran"`
3. **Autorisez** et choisissez la fenêtre
4. **Gemini extraira** tout le texte visible

### **Test Erreur**

1. **Ouvrez la console** du navigateur (F12)
2. **Tapez** une erreur JavaScript volontaire : `throw new Error("Test")`
3. **Dites** : `"Trouve les erreurs"`
4. **Gemini détectera** l'erreur dans la console

---

## 🐛 **DÉPANNAGE**

### **"Permission refusée"**
→ Vous avez cliqué "Annuler" dans la popup
→ **Solution** : Réessayez et cliquez "Partager"

### **"Erreur 429"**
→ Trop de requêtes Gemini
→ **Solution** : Attendez 1 minute

### **"Aucun contenu visible"**
→ Le screenshot est vide/noir
→ **Solution** : Choisissez "Écran complet" au lieu de "Onglet"

### **Popup ne s'affiche pas**
→ Permissions bloquées dans le navigateur
→ **Solution** : Vérifiez les paramètres du site (🔒 dans la barre d'adresse)

---

## 💡 **ASTUCES**

### **Analyser du code**
```
1. Ouvrez votre IDE (VSCode, Cursor, etc.)
2. Dites : "Analyse ce code"
3. Choisissez "Fenêtre" et sélectionnez votre IDE
4. Gemini donnera des suggestions
```

### **Trouver des bugs**
```
1. Reproduisez le bug à l'écran
2. Dites : "Trouve les erreurs"
3. Gemini analysera et expliquera
```

### **Apprendre d'une interface**
```
1. Ouvrez un site avec un design intéressant
2. Dites : "Décris cette interface"
3. Gemini expliquera la composition, les couleurs, etc.
```

---

## 📊 **FONCTIONNEMENT TECHNIQUE**

```
Commande vocale : "Analyse l'écran"
         ↓
Gemini AI détecte : analyze_screen
         ↓
handler → visionService.analyzeCurrentScreen()
         ↓
captureScreen() → navigator.mediaDevices.getDisplayMedia()
         ↓
Popup navigateur → Utilisateur autorise
         ↓
Screenshot capturé (PNG base64)
         ↓
Envoyé à Gemini 2.0 Flash Vision
         ↓
Résultat analysé retourné
         ↓
Affiché dans les logs J.A.R.V.I.S.
```

---

## ✅ **CHECKLIST**

- [x] Vision corrigée avec getDisplayMedia
- [x] Gestion d'erreur améliorée
- [x] 5 types d'analyse disponibles
- [x] Compatible avec Gemini 2.0 Flash (GRATUIT)

---

**Créé le** : 13 février 2026, 23:48  
**Version** : Vision 2.0 - Fully Functional
