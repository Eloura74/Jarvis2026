#!/bin/bash

# Script d'installation J.A.R.V.I.S. pour Linux Ubuntu
# Ce script installe les dépendances système et prépare l'environnement.

echo "🚀 J.A.R.V.I.S. - Initialisation de l'installation Linux (Ubuntu)..."

# 1. Vérification des privilèges
if [ "$EUID" -ne 0 ]; then
  echo "❌ Veuillez lancer ce script avec sudo : sudo ./install-linux.sh"
  exit 1
fi

# 2. Mise à jour des paquets
echo "🔄 Mise à jour des dépôts..."
apt update -y

# 3. Installation des dépendances système (Automation, Volume, Screen, etc.)
echo "📦 Installation des outils système essentiels..."
apt install -y \
  xdotool \
  wmctrl \
  playerctl \
  brightnessctl \
  libasound2-dev \
  curl \
  gcc \
  g++ \
  make

# 4. Vérification de Node.js
if ! command -v node &> /dev/null; then
    echo "🌐 Node.js n'est pas installé. Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# 5. Installation des dépendances du projet
echo "🏗️ Installation des dépendances Node.js (Frontend & Backend)..."
# Se déplacer dans le dossier racine du repo (si besoin)
# npm install

# Installation backend
if [ -d "server" ]; then
    echo "📡 Préparation du serveur..."
    cd server && npm install
    cd ..
fi

# Installation frontend (root)
echo "🎨 Préparation du frontend..."
npm install

echo ""
echo "✅ J.A.R.V.I.S. est prêt pour Linux !"
echo "👉 Pour lancer : ./start-linux.sh"
echo "Note: N'oubliez pas de configurer votre .env.local dans le dossier server/"
