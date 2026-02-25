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

### 🧠 Advanced AI Core (33 Tools Gemini)

- **Gemini 1.5 Flash Integration**: Ultra-fast, multimodal responses with 33 outils fonctionnels.
- **Memory & Persistence**: Context-aware conversations that remember previous interactions.
- **Tool Execution**: Dynamic tool selection and execution based on natural language.

### 🌡️ Monitoring & Sensors

- **Temperature Monitoring**: Outdoor weather (OpenWeather), pool temperature, PC/NAS temps.
- **TrueNAS Monitoring**: Storage pools, disk health, services status.
- **Real-time Alerts**: Automatic notifications for critical thresholds.

### �️ Navigation & Maps

- **Google Maps Integration**: Real-time traffic data, travel time estimation.
- **Route Planning**: Intelligent route suggestions with current traffic conditions.

### 🖨️ 3D Printing

- **Bambu Lab Integration**: Live camera feed, printer status, temperature monitoring.
- **G-code Analysis**: Automatic analysis of print files with time/material estimates.

### � Smartphone Control

- **KDE Connect Integration**: Send notifications, make calls, send SMS to Android devices.
- **Battery Monitoring**: Real-time battery level and charging status.

### 📅 Calendar Management

- **Google Calendar**: Move appointments with conflict detection.
- **Smart Scheduling**: Intelligent event management.

### 🖥️ System Management

- **Multi-Screen Window Control**: Move windows across multiple monitors.
- **Process Management**: List processes by CPU/RAM usage, kill processes.
- **Volume Control**: Set volume, mute/unmute system audio.

### 🔐 Security & Surveillance

- **Home Assistant Security**: Alarm control (arm/disarm), door/window sensors.
- **Camera Integration**: Live snapshots from security cameras.
- **Motion Detection**: Historical motion detection with alerts.

### 🎬 Multimedia

- **YouTube**: Search and play videos via YouTube Data API.
- **Spotify**: Control playback (play/pause/next/previous).
- **Plex**: Launch movies and TV shows on media server.

### �️ Vision & AI

- **Webcam Vision**: Capture and analyze images with Gemini Vision.
- **Object Detection**: Detect specific objects or people in real-time.
- **Screen Analysis**: Analyze screen content with AI.

### 🗣️ Natural Interaction

- **Voice Control**: Hands-free operation with hotword detection ("Jarvis").
- **Text-to-Speech**: Natural-sounding voice feedback.
- **Dynamic UI**: Responsive interface that reacts to voice and system states.

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
