# 🚀 JARVIS - Guide de Configuration des Features Avancées

## ✅ Features Activées Vocalement

Toutes les features suivantes sont **déjà activées** dans le code et répondent aux commandes vocales. Il suffit de configurer les clés API pour les activer complètement.

---

## 📧 1. GMAIL (Lecture & Envoi d'emails)

**Commandes vocales :**
- "Jarvis, lis mes mails"
- "Jarvis, qui m'a écrit ?"
- "Jarvis, envoie un mail à [contact]"

**Configuration :**
1. Aller sur : http://localhost:3001/api/google/auth-url
2. Se connecter avec ton compte Google
3. Autoriser l'accès Gmail et Calendar
4. Le token sera sauvegardé automatiquement

**Statut actuel :** ⚠️ Token expiré - Reconnexion requise

---

## 📅 2. GOOGLE CALENDAR (Gestion agenda)

**Commandes vocales :**
- "Jarvis, mes prochains rendez-vous"
- "Jarvis, ajoute un rendez-vous demain à 14h"
- "Jarvis, déplace mon RDV de 14h à 16h"

**Configuration :** Même processus que Gmail (OAuth partagé)

**Statut actuel :** ⚠️ Token expiré - Reconnexion requise

---

## 💾 3. TRUENAS (Stockage & Disques)

**Commandes vocales :**
- "Jarvis, statut stockage"
- "Jarvis, combien d'espace sur le NAS ?"
- "Jarvis, santé des disques"
- "Jarvis, température des disques"
- "Jarvis, services TrueNAS"

**Configuration :**
1. Ouvrir `.env.local`
2. Ajouter :
```env
TRUENAS_URL=http://192.168.1.X:80
TRUENAS_API_KEY=ton_api_key_truenas
```

**Obtenir la clé API TrueNAS :**
- TrueNAS → Settings → API Keys → Add
- Copier la clé générée

**Statut actuel :** ❌ `TRUENAS_API_KEY manquante dans .env`

---

## 🏠 4. HOME ASSISTANT (Domotique)

**Commandes vocales :**
- "Jarvis, allume la lumière du salon"
- "Jarvis, éteins le chauffage"
- "Jarvis, mets la lumière en bleu"

**Configuration :**
1. Ouvrir `.env.local`
2. Vérifier/Ajouter :
```env
HA_URL=http://192.168.1.193:8123
HA_TOKEN=ton_long_lived_access_token
```

**Obtenir le token Home Assistant :**
- Home Assistant → Profil → Long-Lived Access Tokens → Create Token
- Copier le token généré

**Statut actuel :** ⚠️ Erreur connexion (timeout 192.168.1.193:8123)

---

## 🎵 5. SPOTIFY (Contrôle musique)

**Commandes vocales :**
- "Jarvis, lance Bohemian Rhapsody sur Spotify"
- "Jarvis, pause Spotify"
- "Jarvis, piste suivante"

**Configuration :**
1. Créer une app Spotify : https://developer.spotify.com/dashboard
2. Ajouter dans `.env.local` :
```env
SPOTIFY_CLIENT_ID=ton_client_id
SPOTIFY_CLIENT_SECRET=ton_client_secret
SPOTIFY_REFRESH_TOKEN=ton_refresh_token
```

**Statut actuel :** ⚠️ Non configuré

---

## 📱 6. PHONE (KDE Connect - Android)

**Commandes vocales :**
- "Jarvis, appelle [contact]"
- "Jarvis, envoie un SMS à [contact] : [message]"
- "Jarvis, envoie une notification sur mon téléphone"
- "Jarvis, batterie téléphone"

**Configuration :**
1. Installer KDE Connect sur Android
2. Installer KDE Connect sur PC
3. Coupler les appareils
4. Autoriser les permissions (SMS, Appels, Notifications)

**Statut actuel :** ⚠️ Non configuré

---

## 🔒 7. SÉCURITÉ/CAMÉRAS

**Commandes vocales :**
- "Jarvis, montre la caméra du jardin"
- "Jarvis, état de l'alarme"
- "Jarvis, historique des mouvements"

**Configuration :** Utilise Home Assistant (voir section 4)

**Statut actuel :** ⚠️ Dépend de Home Assistant

---

## 🌐 8. RECHERCHE WEB (Google/YouTube)

**Commandes vocales :**
- "Jarvis, recherche sur le web [query]"
- "Jarvis, montre-moi fichiers STL [objet]"
- "Jarvis, cherche sur YouTube [vidéo]"

**Configuration :** ✅ Aucune - Fonctionne immédiatement !

**Statut actuel :** ✅ Opérationnel

---

## 🎬 9. PLEX (Serveur média)

**Commandes vocales :**
- "Jarvis, lance Inception sur Plex"
- "Jarvis, regarde [série/film]"

**Configuration :**
1. Ajouter dans `.env.local` :
```env
PLEX_URL=http://192.168.1.X:32400
PLEX_TOKEN=ton_plex_token
```

**Obtenir le token Plex :**
- Plex Web → Paramètres → Account → Get Token

**Statut actuel :** ⚠️ Non configuré

---

## 📊 RÉSUMÉ DES STATUTS

| Feature | Détection Vocale | Configuration | Statut |
|---------|------------------|---------------|--------|
| Chrome Launch | ✅ | ✅ | ✅ Opérationnel |
| Recherche Web | ✅ | ✅ | ✅ Opérationnel |
| Gmail | ✅ | ⚠️ Token expiré | ⚠️ Reconnexion requise |
| Calendar | ✅ | ⚠️ Token expiré | ⚠️ Reconnexion requise |
| TrueNAS | ✅ | ❌ API key manquante | ❌ À configurer |
| Home Assistant | ✅ | ⚠️ Timeout | ⚠️ Vérifier connexion |
| Spotify | ✅ | ❌ Non configuré | ❌ À configurer |
| Phone (KDE) | ✅ | ❌ Non configuré | ❌ À configurer |
| Sécurité | ✅ | ⚠️ Dépend HA | ⚠️ Dépend HA |
| Plex | ✅ | ❌ Non configuré | ❌ À configurer |

---

## 🚀 QUICK START

**Pour activer rapidement les features principales :**

1. **Google (Gmail + Calendar)** :
   - Visite : http://localhost:3001/api/google/auth-url
   - Connecte-toi et autorise

2. **TrueNAS** :
   - Ajoute `TRUENAS_API_KEY` dans `.env.local`
   - Redémarre le backend

3. **Home Assistant** :
   - Vérifie que HA est accessible sur `192.168.1.193:8123`
   - Ajoute `HA_TOKEN` dans `.env.local`

4. **Teste** :
   - "Jarvis, lis mes mails"
   - "Jarvis, statut stockage"
   - "Jarvis, allume la lumière"

---

## 🎯 ARCHITECTURE TECHNIQUE

Toutes les features utilisent le **système de détection intelligente** :

1. **Détection par mots-clés** : Analyse de la commande vocale
2. **ThinkingBudget = 0** : Désactive la réflexion pour forcer les tools
3. **Instructions CRITICAL** : Ordres absolus à Gemini
4. **allowedFunctionNames** : Mode ANY restreint (évite "too much branching")

**Fichier principal :** `services/geminiService.ts` (lignes 186-418)

---

## 📝 NOTES

- Les détections vocales fonctionnent **immédiatement**
- Les erreurs actuelles sont **normales** (clés API manquantes)
- Chaque feature est **indépendante** (configure seulement celles que tu veux)
- Le système est **extensible** (facile d'ajouter de nouvelles features)

---

**Créé le :** 11 août 2026  
**Version :** 1.0  
**Auteur :** Cascade AI + Eloura74
