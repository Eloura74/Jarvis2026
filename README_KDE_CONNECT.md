# Configuration KDE Connect pour Jarvis

## Prérequis

Pour utiliser les fonctionnalités de contrôle smartphone (notifications, appels, SMS, batterie), **KDE Connect doit être installé** sur :

1. **Votre PC Windows**
2. **Votre smartphone Android**

---

## Installation

### 1. Sur Windows

Télécharger et installer KDE Connect depuis :
- **Microsoft Store** : https://apps.microsoft.com/detail/9N93MRMSXBF0
- **Site officiel** : https://kdeconnect.kde.org/download.html

Après installation, `kdeconnect-cli` sera disponible dans le PATH système.

### 2. Sur Android

Installer l'application depuis :
- **Google Play Store** : https://play.google.com/store/apps/details?id=org.kde.kdeconnect_tp

---

## Configuration

1. **Ouvrir KDE Connect** sur Windows et Android
2. **Activer le Bluetooth et Wi-Fi** sur les deux appareils (même réseau local)
3. **Apparier les appareils** :
   - Sur Android : cliquer sur "Appareil disponible"
   - Sur Windows : accepter la demande d'appairage
4. **Activer les permissions** sur Android :
   - Notifications
   - Téléphone (appels)
   - SMS
   - Batterie

---

## Vérification

Tester la connexion dans un terminal :

```bash
kdeconnect-cli -a
```

Devrait afficher la liste des appareils connectés.

---

## Fonctionnalités Jarvis

Une fois KDE Connect configuré, Jarvis peut :

✅ **Envoyer des notifications** : *"Envoie une notification sur mon téléphone : rappel réunion"*  
✅ **Passer des appels** : *"Appelle Maman"* (nécessite contacts configurés)  
✅ **Envoyer des SMS** : *"Envoie un SMS à Pierre : j'arrive dans 10 minutes"*  
✅ **Vérifier la batterie** : *"Batterie de mon téléphone"*

❌ **Alarmes non supportées** : KDE Connect ne permet pas de créer des alarmes (limitation API)

---

## Dépannage

### Erreur : `kdeconnect-cli n'est pas reconnu`

→ KDE Connect n'est pas installé ou pas dans le PATH système.  
→ Réinstaller depuis Microsoft Store ou redémarrer le PC après installation.

### Erreur : `Aucun smartphone connecté`

→ Vérifier que les deux appareils sont sur le même réseau Wi-Fi.  
→ Réapparier les appareils dans KDE Connect.  
→ Vérifier que les permissions sont activées sur Android.

### Les commandes ne fonctionnent pas

→ Tester manuellement : `kdeconnect-cli --send-notification "Test"`  
→ Vérifier les logs backend Jarvis pour plus de détails.

---

## Alternative : Notifications uniquement

Si KDE Connect n'est pas disponible, utiliser les **notifications comme rappels** :

*"Envoie une notification sur mon téléphone dans 5 minutes : sortir le linge"*

Jarvis créera une notification qui servira de rappel (équivalent d'une alarme simple).
