# 🔧 Flasher l'ESP32-S3 depuis Windsurf

## 📋 Prérequis

### Option 1 : PlatformIO CLI (Recommandé)

```bash
pip install platformio
```

### Option 2 : VSCode + PlatformIO

Si tu as déjà VSCode avec PlatformIO installé, le CLI est automatiquement disponible.

---

## 🚀 Méthode 1 : Script PowerShell (Le Plus Simple)

### Depuis Windsurf Terminal :

```powershell
cd a:\02-PROJECTS\Jarvis2026\sphere
.\flash_esp32.ps1
```

**Ce script fait tout automatiquement** :

1. ✅ Vérifie que PlatformIO CLI est installé
2. ✅ Compile le firmware
3. ✅ Upload vers l'ESP32-S3
4. ✅ Propose d'ouvrir le moniteur série

---

## 🚀 Méthode 2 : Commandes Manuelles

### 1. Compiler le firmware

```bash
cd a:\02-PROJECTS\Jarvis2026\sphere
python -m platformio run
```

### 2. Upload vers ESP32

```bash
python -m platformio run --target upload
```

### 3. Moniteur série (optionnel)

```bash
python -m platformio device monitor --baud 115200
```

---

## 🚀 Méthode 3 : Commande Tout-en-Un

```bash
cd a:\02-PROJECTS\Jarvis2026\sphere
python -m platformio run --target upload && python -m platformio device monitor
```

---

## 🐛 Problèmes Courants

### ❌ "pio: command not found" ou "Le terme 'pio' n'est pas reconnu"

**Solution** : Utilise `python -m platformio` au lieu de `pio`

```bash
python -m platformio run
```

**Ou installe PlatformIO** :

```bash
pip install platformio
```

### ❌ "Error: Please specify upload_port"

**Solutions** :

1. Vérifie que l'ESP32 est branché en USB
2. Ferme Arduino IDE, Serial Monitor, ou tout programme utilisant le port COM
3. Spécifie manuellement le port :

```bash
python -m platformio run --target upload --upload-port COM3
```

### ❌ "A fatal error occurred: Failed to connect"

**Solutions** :

1. Maintiens le bouton **BOOT** pendant l'upload
2. Appuie sur le bouton **RESET** avant l'upload
3. Vérifie le câble USB (certains câbles ne transmettent que l'alimentation)

### ❌ "Access denied to COM port"

**Solution** : Un autre programme utilise le port

1. Ferme JARVIS (si lancé)
2. Ferme Arduino IDE
3. Ferme tout Serial Monitor ouvert
4. Réessaye

---

## 📊 Vérifier le Port COM

### Windows PowerShell :

```powershell
python -m platformio device list
```

**Exemple de sortie** :

```
COM3
----
Hardware ID: USB VID:PID=303A:1001
Description: USB-SERIAL CH340 (COM3)
```

---

## 🎯 Workflow Complet depuis Windsurf

1. **Modifie le code** dans `src/main.cpp`
2. **Flash depuis le terminal Windsurf** :
   ```powershell
   cd a:\02-PROJECTS\Jarvis2026\sphere
   .\flash_esp32.ps1
   ```
3. **Teste** : L'ESP32 redémarre automatiquement avec le nouveau firmware
4. **Debug** : Ouvre le moniteur série si besoin
   ```bash
   pio device monitor --baud 115200
   ```

---

## ✅ Avantages de cette Méthode

- ✅ **Pas besoin d'ouvrir VSCode**
- ✅ **Flash directement depuis Windsurf**
- ✅ **Script automatisé** (flash_esp32.ps1)
- ✅ **Moniteur série intégré**
- ✅ **Gestion d'erreurs claire**

---

## 🔗 Commandes Utiles

| Commande              | Description                         |
| --------------------- | ----------------------------------- |
| `pio run`             | Compile le firmware                 |
| `pio run -t upload`   | Compile + Upload                    |
| `pio run -t clean`    | Nettoie le build                    |
| `pio device list`     | Liste les ports COM                 |
| `pio device monitor`  | Moniteur série                      |
| `pio run -t uploadfs` | Upload filesystem (SPIFFS/LittleFS) |

---

**Maintenant tu peux flasher l'ESP32 directement depuis Windsurf !** 🚀
