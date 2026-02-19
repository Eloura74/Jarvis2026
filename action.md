# ⚡ J.A.R.V.I.S. - Action & Command Guide

This document lists the capabilities and actionable commands available in the J.A.R.V.I.S. system.
_Note: Commands can be triggered via Voice or Text input._

---

## 🖥️ Application Management

_Controlled via `appsDatabase.ts`_

| Action          | Example Command                     | Notes                             |
| :-------------- | :---------------------------------- | :-------------------------------- |
| **Launch App**  | "Ouvre VS Code" / "Lance Spotify"   | Supports fuzzy matching on names. |
| **Search Apps** | "Trouve un éditeur de texte"        | Searches by category/keyword.     |
| **Browser**     | "Ouvre Chrome" / "Lance Opera GX"   | Supports multiple browsers.       |
| **Creative**    | "Lance Photoshop" / "Ouvre Blender" | Design & 3D tools.                |
| **3D Printing** | "Lance Bambu Studio"                | Slicer software.                  |
| **Development** | "Ouvre Terminal" / "Lance Docker"   | Dev tools & shells.               |

---

## ⚙️ System Control

_Powered by PowerShell & Windows APIs_

| Category    | Action      | Example Command                           |
| :---------- | :---------- | :---------------------------------------- |
| **Volume**  | Set/Mute    | "Mets le volume à 50%" / "Coupe le son"   |
| **Media**   | Playback    | "Pause la musique" / "Suivant" / "Play"   |
| **Power**   | Power State | "Verrouille le PC" / "Mise en veille"     |
| **Display** | Brightness  | "Baisse la luminosité" / "Luminosité max" |
| **Files**   | Search      | "Recherche le dossier 'Projets'"          |

---

## 🏠 Home Automation (IoT)

_Integration with Home Assistant_

### 💡 Lights & Power

- **Control**: "Allume le salon", "Eteins le bureau".
- **Color/Brightness**: "Mets la lumière du canapé en bleu", "Luminosité salon 50%".
- **Entities**:
  - `light.canape`, `light.cheminee`, `light.led_switchwire`
  - `light.a1mini_...` (Imprimante)

### 🌡️ Sensors & Climate

- **Temperature**: "Quelle est la température du bureau ?"
- **Humidity**: "Taux d'humidité à l'étage ?"
- **Doors**: Check status for Garage, Portail, Bedroom doors.

### 🖨️ 3D Printers (Bambu Lab)

- **Status Checks**: "Est-ce que l'imprimante VZ330 tourne ?"
- **Monitoring**: Bed temp, Nozzle temp, Print progress (%).
- **Cameras**: View printer feed via UI overlay.

---

## 👁️ Vision & Perception

_Multimodal AI Capabilities_

| Feature             | Description                      | Command                                  |
| :------------------ | :------------------------------- | :--------------------------------------- |
| **Screen Analysis** | Analyzes current screen content. | "Qu'est-ce que tu vois sur mon écran ?"  |
| **Code Review**     | Reviews code visible on screen.  | "Analyse ce code et trouve les erreurs." |
| **Webcam Vision**   | Sees through connected camera.   | "Active la caméra" / "Sentinel Mode"     |
| **Ghost Mode**      | Passive background monitoring.   | _Automatic / "Active Ghost Mode"_        |

---

## 🧠 Productivity & Organization

- **Clock/Time**: "Quelle heure est-il ?"
- **Weather**: "Quel temps fait-il ?" (Requires API key).
- **Reminders**: "Rappelle-moi de..." (Context dependent).
- **Knowledge**: General Q&A, coding help, summaries.

---

## ⌨️ Shortcuts & UI Actions

- **`Win + J`**: Quick detailed analysis (Ghost Mode trigger - configurable).
- **Click Sphere**: Toggle listening mode manually.
- **Privacy Button**: Instantly disable Mic & Camera.
- **Ghost Mode Toggle**: Switch between Active/Passive monitoring.

---

> _System capabilities allow for chaining commands (e.g., "Allume la lumière et lance VS Code"). Efficiency is the priority._
