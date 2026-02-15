#!/bin/bash

# Script de lancement J.A.R.V.I.S. pour Linux Ubuntu
# Lance simultanément le backend et le frontend.

echo "🚀 Lancement de J.A.R.V.I.S. Mainframe (Linux Mode)..."

# 1. Lancement du Backend
if [ -d "server" ]; then
    echo "📡 Démarrage du serveur backend..."
    cd server
    npm start &
    BACKEND_PID=$!
    cd ..
else
    echo "❌ Dossier server non trouvé."
    exit 1
fi

# 2. Lancement du Frontend (Vite)
echo "🎨 Démarrage de l'interface graphique..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✨ J.A.R.V.I.S. est en ligne !"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter tous les services."

# Gérer l'arrêt propre
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
