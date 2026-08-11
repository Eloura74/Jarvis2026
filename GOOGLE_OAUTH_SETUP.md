# 🔐 Configuration Google OAuth pour JARVIS

## Problème actuel
Erreur `invalid_grant` → Les credentials OAuth sont invalides ou expirés.

## ✅ Solution : Recréer les credentials

### 1. Accéder à Google Cloud Console
👉 https://console.cloud.google.com/

### 2. Créer/Sélectionner un projet
- Clique sur le menu déroulant en haut à gauche
- Sélectionne un projet existant OU crée-en un nouveau : "JARVIS-Assistant"

### 3. Activer les APIs nécessaires
👉 https://console.cloud.google.com/apis/library

**Recherche et active :**
- ✅ **Gmail API**
- ✅ **Google Calendar API**

### 4. Créer les credentials OAuth 2.0
👉 https://console.cloud.google.com/apis/credentials

**a) Configurer l'écran de consentement OAuth :**
- Clique sur "Écran de consentement OAuth"
- Type d'utilisateur : **Externe** (ou Interne si G Suite)
- Nom de l'application : **JARVIS Assistant**
- E-mail d'assistance : ton email
- Domaines autorisés : laisse vide
- Scopes : Ajoute manuellement :
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`
- Utilisateurs de test : Ajoute ton email Gmail

**b) Créer les credentials :**
- Clique sur "Créer des identifiants" → "ID client OAuth 2.0"
- Type d'application : **Application Web**
- Nom : **JARVIS Backend**
- URI de redirection autorisés : Ajoute :
  ```
  http://localhost:3001/api/google/oauth-callback
  ```
- Clique sur **Créer**

**c) Télécharger le fichier JSON :**
- Une popup apparaît avec ton **Client ID** et **Client Secret**
- Clique sur **Télécharger JSON**
- Renomme le fichier en : `google_credentials.json`
- Place-le à la racine du projet : `a:\02-PROJECTS\Jarvis2026\google_credentials.json`

### 5. Vérifier le fichier google_credentials.json

Le fichier doit ressembler à :
```json
{
  "web": {
    "client_id": "123456789-abcdefg.apps.googleusercontent.com",
    "project_id": "jarvis-assistant-123456",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-abcdefghijklmnop",
    "redirect_uris": ["http://localhost:3001/api/google/oauth-callback"]
  }
}
```

### 6. Supprimer l'ancien token
```bash
cd a:\02-PROJECTS\Jarvis2026\server
del google_token.json
```

### 7. Redémarrer le backend
```bash
node server.js
```

### 8. Réessayer l'authentification
👉 http://localhost:3001/api/google/auth-url

---

## 🔍 Vérification

**Si tout fonctionne, tu verras :**
1. Page Google OAuth avec ton application "JARVIS Assistant"
2. Demande d'autorisation pour Gmail et Calendar
3. Redirection vers une page de succès
4. Fichier `google_token.json` créé dans `server/`

**Ensuite, teste :**
- "Jarvis, lis mes mails"
- "Jarvis, mes prochains rendez-vous"

---

## ⚠️ Erreurs courantes

### "invalid_grant"
- Credentials expirés ou invalides
- Solution : Recréer les credentials (étapes ci-dessus)

### "redirect_uri_mismatch"
- L'URI de redirection ne correspond pas
- Solution : Vérifier que `http://localhost:3001/api/google/oauth-callback` est bien dans la liste

### "access_denied"
- L'utilisateur n'est pas dans les "Utilisateurs de test"
- Solution : Ajouter ton email dans l'écran de consentement OAuth

---

**Créé le :** 11 août 2026  
**Version :** 1.0
