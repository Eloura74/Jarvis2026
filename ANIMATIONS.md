# 🎨 JARVIS 2026 - ANIMATIONS SCREEN

**Ce fichier liste toutes les animations visuelles à créer pour le screen holographique.**
**⚠️ À implémenter APRÈS les fonctionnalités backend.**

---

## 🎭 ANIMATIONS PAR CATÉGORIE

### 🚪 Capteurs & Alertes

#### HUD Alerte Mouvement
- **Trigger** : Détection mouvement capteur Tuya
- **Animation** :
  - Pulse rouge sur bord écran
  - Icône mouvement animée (ondes)
  - Texte "MOUVEMENT DÉTECTÉ - [Lieu]"
  - Fade out après 5s
- **Son** : Alerte courte (bip)

#### HUD Statut Portail
- **Trigger** : Demande vocale ou changement état
- **Animation** :
  - Icône portail 3D (ouvert/fermé)
  - Couleur : vert (fermé) / orange (ouvert)
  - Timeline : durée ouverture si >10min
  - Rotation douce de l'icône

#### HUD Température Extérieure
- **Trigger** : Demande vocale météo
- **Animation** :
  - Thermomètre 3D avec mercure animé
  - Gradient couleur selon température
  - Particules (neige/pluie/soleil) selon météo
  - Chiffres qui s'incrémentent progressivement

#### HUD Température Piscine
- **Trigger** : Demande vocale ou alerte seuil
- **Animation** :
  - Vagues d'eau animées
  - Couleur eau selon température (bleu froid → rouge chaud)
  - Bulles montantes
  - Alerte visuelle si hors plage 18-30°C

#### HUD Températures Système (PC/NAS)
- **Trigger** : Demande vocale monitoring
- **Animation** :
  - Graphiques temps réel (CPU, GPU, disques)
  - Barres de progression animées
  - Couleur : vert (<60°C) → orange (60-80°C) → rouge (>80°C)
  - Particules de chaleur si >70°C

---

### 🗺️ Navigation

#### HUD Trajet Temps Réel
- **Trigger** : Demande itinéraire
- **Animation** :
  - Carte 3D stylisée (style Tron)
  - Ligne de trajet animée (progression)
  - Icône voiture qui avance
  - Temps restant avec compte à rebours
  - Zones trafic colorées (vert/orange/rouge)
  - Pulse sur destination

---

### 🖨️ Impression 3D

#### HUD Caméra Imprimante
- **Trigger** : Demande vue caméra A1 mini
- **Animation** :
  - Cadre holographique autour stream vidéo
  - Overlay infos (température, progression)
  - Scan lines effet "surveillance"
  - Coins animés (style HUD militaire)

#### HUD Statut Impression
- **Trigger** : Notification MQTT (début/milieu/fin/erreur)
- **Animation** :
  - Barre progression circulaire
  - Icône imprimante 3D animée (tête qui bouge)
  - Temps restant avec horloge
  - Température hotend/bed en temps réel
  - Effet "success" vert à 100%
  - Effet "error" rouge si problème

#### Animation STL Holographique
- **Trigger** : Recherche STL ou affichage modèle
- **Animation** :
  - Modèle 3D qui apparaît par lignes (scan vertical)
  - Rotation automatique lente
  - Éclairage dynamique (3 points)
  - Grille holographique sous le modèle
  - Particules lumineuses autour
  - Zoom in/out doux

#### HUD Rendu G-code
- **Trigger** : Demande visualisation G-code
- **Animation** :
  - Affichage couche par couche (slider)
  - Couleur par type mouvement (extrusion/déplacement)
  - Timeline avec preview
  - Rotation 360° du modèle
  - Infos : temps par couche, filament utilisé

---

### 📱 Smartphone

#### HUD Gestion Réveils
- **Trigger** : Demande liste/modification réveils
- **Animation** :
  - Liste réveils avec icônes horloge
  - Toggle animé (ON/OFF)
  - Effet swipe pour suppression
  - Pulse sur réveil actif proche
  - Couleur : bleu (actif) / gris (inactif)

---

### 💾 Stockage

#### HUD Statut TrueNAS
- **Trigger** : Demande état NAS
- **Animation** :
  - Disques 3D en rotation
  - Barres espace utilisé/disponible
  - Couleur santé SMART (vert/orange/rouge)
  - Graphique I/O en temps réel
  - Services actifs avec icônes

---

### 📅 Agenda

#### HUD Modification Agenda
- **Trigger** : Déplacement RDV
- **Animation** :
  - Timeline horizontale
  - RDV qui glisse vers nouveau créneau
  - Effet "drag & drop" visuel
  - Confirmation avec checkmark animé
  - Alerte si conflit (shake + rouge)

---

### 🖥️ Système

#### HUD Gestion Fenêtres
- **Trigger** : Minimisation/déplacement fenêtre
- **Animation** :
  - Miniature fenêtre qui se réduit
  - Effet "window snap" pour déplacement
  - Grille multi-écrans si applicable
  - Highlight fenêtre active

#### Animation Quotas API
- **Trigger** : Demande limites Antigravity/Windsurf
- **Animation** :
  - Jauges circulaires (style speedometer)
  - Pourcentage utilisé animé
  - Couleur : vert (0-70%) → orange (70-90%) → rouge (>90%)
  - Prédiction épuisement quota
  - Reset countdown si quota journalier

---

### 🎬 Multimédia

#### HUD Lecture Média
- **Trigger** : Lancement film/série
- **Animation** :
  - Affiche film avec effet "card flip"
  - Barre lecture avec progression
  - Contrôles (play/pause/stop) animés
  - Infos : durée, plateforme, qualité
  - Effet "cinema curtains" à l'ouverture

---

### 👁️ Vision

#### HUD Vision Webcam
- **Trigger** : Analyse vision webcam
- **Animation** :
  - Cadre de scan qui parcourt l'image
  - Détection objets avec bounding boxes
  - Labels animés (fade in)
  - Confiance % par objet
  - Effet "matrix rain" en arrière-plan
  - Description vocale synchronisée avec highlights visuels

---

## 🎨 STYLES VISUELS GLOBAUX

### Palette Couleurs
- **Primaire** : Cyan (#00F3FF) - style Iron Man
- **Secondaire** : Or (#FFD700)
- **Succès** : Vert (#00FF41)
- **Warning** : Orange (#FF9500)
- **Erreur** : Rouge (#FF3B30)
- **Neutre** : Gris (#8E8E93)

### Typographie
- **Titres** : Orbitron (futuriste)
- **Corps** : Rajdhani (lisible)
- **Mono** : Fira Code (terminal)

### Effets Communs
- **Glow** : Box-shadow cyan avec blur
- **Pulse** : Animation scale 1.0 → 1.05 → 1.0 (2s loop)
- **Fade in** : Opacity 0 → 1 (0.3s ease-out)
- **Slide in** : TranslateY(-20px) → 0 (0.4s ease-out)
- **Scan lines** : Overlay lignes horizontales (opacity 0.1)
- **Particules** : Points lumineux flottants (Three.js)

### Sons
- **Success** : Bip aigu court
- **Error** : Bip grave double
- **Alert** : Sirène courte
- **Notification** : Ding doux
- **Confirmation** : "Monsieur ?" (voix Jarvis)

---

## 📐 SPÉCIFICATIONS TECHNIQUES

### Framework
- **Framer Motion** : Animations React
- **Three.js** : Rendu 3D
- **CSS Animations** : Effets simples
- **GSAP** : Animations complexes (si nécessaire)

### Performance
- **60 FPS** : Toutes animations fluides
- **GPU Acceleration** : transform, opacity uniquement
- **Lazy Loading** : Animations chargées à la demande
- **Cleanup** : Destruction animations après usage

### Responsive
- **Desktop** : Animations complètes
- **Mobile** : Animations simplifiées (économie batterie)
- **Low-end** : Fallback animations CSS simples

---

**Dernière mise à jour** : 24 février 2026, 01:10
**Total animations** : 20 HUD + effets globaux
