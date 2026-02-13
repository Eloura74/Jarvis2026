# 🧪 TEST VISION - Instructions

## ✅ **CORRECTIFS APPLIQUÉS**

### **1. Prompt Gemini Renforcé**
- ✅ Ajout de règle explicite : "SCREEN ANALYSIS"
- ✅ Exemples clairs dans le prompt système
- ✅ Mots-clés détectés : "écran", "analyse", "lis", "vois", etc.

### **2. Description de l'Outil**
- ✅ Marqué "CRITICAL: MUST USE"
- ✅ Liste complète des déclencheurs en français et anglais
- ✅ Types d'analyse clarifiés

---

## 🧪 **COMMANDES DE TEST**

### **Test 1 : Analyse Générale**
```
"Analyse l'écran"
```
**Attendu** :
1. Gemini détecte `analyze_screen({type: "general"})`
2. Log : "📸 Capture d'écran en cours..."
3. Popup navigateur pour partage d'écran
4. Résultat de l'analyse dans les logs

---

### **Test 2 : OCR (Lecture de Texte)**
```
"Lis ce que tu vois"
```
**Attendu** :
1. Gemini détecte `analyze_screen({type: "ocr"})`
2. Extraction du texte visible à l'écran

---

### **Test 3 : Détection d'Erreurs**
```
"Trouve les erreurs à l'écran"
```
**Attendu** :
1. Gemini détecte `analyze_screen({type: "error"})`
2. Recherche d'erreurs, bugs, messages d'alerte

---

### **Test 4 : Variante Courte**
```
"Qu'est-ce que je vois ?"
```
**Attendu** :
1. Gemini détecte `analyze_screen({type: "general"})`
2. Description du contenu visible

---

## 🔍 **DÉBOGAGE SI ÇA NE MARCHE PAS**

### **Si Gemini passe en conversation au lieu d'exécuter l'outil :**

**Vérifier dans les logs** :
```
COMMAND: Analyzing: "analyse l'écran"
RESPONSE: Intent: Conversation  ← ❌ MAUVAIS
```

**Au lieu de** :
```
COMMAND: Analyzing: "analyse l'écran"
RESPONSE: Intent: 1 tool to execute  ← ✅ BON
RESPONSE: [1/1] Executing: analyze_screen
```

---

### **Solution Alternative : Formuler Différemment**

Si "analyse l'écran" ne marche toujours pas, essayez :

```
"Capture et analyse l'écran maintenant"
"Utilise analyze_screen"
"Fais une capture d'écran et analyse"
"Active l'outil d'analyse d'écran"
```

---

## 📊 **WORKFLOW COMPLET**

```
1. Utilisateur : "Analyse l'écran"
         ↓
2. Gemini AI : Parsing de la commande
         ↓
3. Détection : analyze_screen tool
         ↓
4. Handler : visionHandlers.handleAnalyzeScreen()
         ↓
5. Service : visionService.analyzeCurrentScreen()
         ↓
6. Capture : navigator.mediaDevices.getDisplayMedia()
         ↓
7. Permission : Popup navigateur
         ↓
8. Screenshot : Canvas → PNG base64
         ↓
9. Gemini Vision : Analyse de l'image
         ↓
10. Résultat : Texte descriptif retourné
```

---

## ⚡ **TESTS RAPIDES**

### **Commandes Certaines de Fonctionner**

Ces commandes ont des patterns très explicites :

```
✅ "Analyse mon écran maintenant"
✅ "Fais un screenshot et analyse"
✅ "Qu'est-ce qu'il y a sur mon écran"
✅ "Lis le texte sur l'écran"
✅ "Trouve les erreurs sur cet écran"
```

---

## 🎯 **PROCHAINE ÉTAPE**

**TESTEZ MAINTENANT** :

1. **Rechargez J.A.R.V.I.S.** (F5)
2. **Attendez 5 secondes** (pour éviter 429)
3. **Dites** : `"Analyse l'écran"`
4. **Vérifiez les logs** :
   - Cherchez "Intent: 1 tool to execute" ✅
   - OU "Intent: Conversation" ❌

Si c'est ❌, **dites-moi** et j'ajusterai encore le prompt.

---

**Créé le** : 13 février 2026, 23:52  
**Version** : Vision Detection Enhanced
