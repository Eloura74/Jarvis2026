<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="JARVIS Banner" width="100%" />

  <h1>J.A.R.V.I.S. - Autonomous System Interface</h1>
  
  <p>
    <strong>Just A Rather Very Intelligent System</strong>
    <br />
    <em>Next-generation AI Assistant integrating Voice, Vision, and Home Automation.</em>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#configuration">Configuration</a> •
    <a href="#usage">Usage</a>
  </p>
</div>

---

## 🚀 Overview

**J.A.R.V.I.S.** is a comprehensive AI assistant designed to act as a central nervous system for your digital and physical environment. Built with a modern React frontend and a robust Node.js backend, it leverages **Google's Gemini 2.5 Flash** model to provide real-time intelligence, natural voice interaction, and seamless control over your system and smart home devices.

Unlike standard chatbots, J.A.R.V.I.S. is **agentic**: it can see your screen, control your mouse, manage your files, and interact with your IoT devices through Home Assistant.

## ✨ Features

### 🧠 Advanced AI Core

- **Gemini 2.5 Flash Integration**: Ultra-fast, multimodal responses with high context awareness.
- **Memory & Persistence**: Context-aware conversations that remember previous interactions.
- **RAG System**: Retrieval-Augmented Generation for accessing local documentation and knowledge.

### 👁️ Vision & Perception

- **Screen Analysis**: Instantly analyze and discuss what's on your screen.
- **Webcam Vision**: "See" the physical world through connected cameras (Sentinel Mode).
- **Ghost Mode**: Proactive background monitoring to assist without direct prompts.

### 🗣️ Natural Interaction

- **Voice Control**: Hands-free operation with hotword detection ("Jarvis").
- **Neural Voice Synthesis**: Natural-sounding text-to-speech feedback.
- **Holographic Visualizer**: Dynamic 3D interface that reacts to voice and system states.

### 🏠 Home Automation & IoT

- **Home Assistant Integration**: Native control of lights, sensors, switches, and covers.
- **3D Printer Management**: Monitor Bambu Lab printers (status, temps, video feed).
- **Environmental Monitoring**: Real-time display of temperature, humidity, and air quality.

### 💻 System Control

- **App Management**: Launch, close, and manage applications (VS Code, Chrome, Spotify, etc.).
- **Media Control**: Play/Pause, Volume, Next/Prev for system audio.
- **File System**: Search, read, and manage local files.
- **Windows Integration**: Control brightness, lock screen, shutdown/restart.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Three.js (Visualizer).
- **Backend**: Node.js, Express, Socket.io (Real-time comms).
- **AI**: Google Generative AI SDK (Gemini 2.5 Flash).
- **Integration**: MQTT (IoT), Home Assistant API, System commands (PowerShell).

## 📦 Installation

**Prerequisites:** Node.js v18+, npm, Git.

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/jarvis-2026.git
   cd jarvis-2026
   ```

2. **Install Frontend Dependencies**

   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

## ⚙️ Configuration

1. **Environment Config**
   Create a `.env.local` file in the root directory:

   ```env
   # Gemini API
   VITE_GEMINI_API_KEY=your_gemini_api_key_here

   # Home Assistant (Optional)
   VITE_HA_URL=http://your-ha-instance:8123
   VITE_HA_TOKEN=your_long_lived_access_token

   # Weather (Optional)
   VITE_WEATHER_API_KEY=your_weather_api_key
   ```

2. **App Database**
   Edit `appsDatabase.ts` to map your local applications (paths to `.exe`).

## ▶️ Usage

### One-Click Start (Windows)

Run the included batch script to launch both client and server:

```bash
start-jarvis.bat
```

### Manual Start

**Terminal 1 (Backend):**

```bash
npm run backend
```

**Terminal 2 (Frontend):**

```bash
npm run dev
```

Access the interface at `http://localhost:5173`.

> **💡 Note:** For a complete list of valid voice commands and system actions, please refer to the [**Action & Command Guide**](./action.md).

## 🛡️ Privacy & Security

J.A.R.V.I.S. runs locally on your machine.

- **Code Execution**: Commands are executed with user privileges.
- **Vision Data**: Screen captures are processed in memory and sent to Gemini API (subject to Google's data policy) but not stored locally unless requested.
- **API Keys**: Stored in local environment files. Never commit `.env` files to version control.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

---

<div align="center">
  <em>Built with ❤️ by Faber & The Codeium Team</em>
</div>
