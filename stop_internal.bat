@echo off
echo [1/2] Arrêt chirurgical des processus JARVIS...

REM On cible les fenêtres par leur titre défini dans start_internal.bat
taskkill /F /FI "WINDOWTITLE eq JARVIS_CORE" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq JARVIS_BACKEND" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq JARVIS_FRONTEND" /T >nul 2>&1

REM Sécurité supplémentaire pour les processus orphelins
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1

echo [2/2] Libération des ports...
echo [SUCCESS] JARVIS est maintenant hors ligne.
timeout /t 2
exit
