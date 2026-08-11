@echo off
:: Désactive l'affichage des commandes
setlocal

:: Lancement du noyau Python via le venv (Chemin direct pour éviter powershell/cmd visibles)
cd /d "A:\02-PROJECTS\JarvisDecoupe"
start /b "" "A:\02-PROJECTS\Jarvis2026\venv\Scripts\python.exe" main.py

:: Lancement du Backend Node
cd /d "A:\02-PROJECTS\Jarvis2026"
start /b "" node server\server.js

:: Lancement du Frontend Vite
:: Utilisation de /c pour npm pour qu'il ne crée pas de nouvelle console visible
start /b "" cmd /c npm run dev

exit
