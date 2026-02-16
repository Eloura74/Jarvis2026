@echo off
REM ============================================================================
REM SCRIPT D'ARRÊT J.A.R.V.I.S.
REM Rôle : Ferme proprement les processus Node.js et Vite (npm)
REM ============================================================================

echo.
echo ============================================================
echo   ARRÊT DES SERVICES J.A.R.V.I.S.
echo ============================================================
echo.

echo [1/2] Fermeture des instances Node.js...
taskkill /F /IM node.exe /T >nul 2>&1

echo [2/2] Nettoyage des processus résiduels...
REM On tue les processus cmd qui pourraient rester ouverts en arrière-plan
REM Note : attention, cela peut fermer d'autres terminaux si mal ciblé, 
REM mais taskkill /IM node.exe est généralement suffisant pour arrêter les serveurs.

echo.
echo ============================================================
echo   SYSTÈME HORS LIGNE.
echo ============================================================
echo.

timeout /t 2 >nul
exit
