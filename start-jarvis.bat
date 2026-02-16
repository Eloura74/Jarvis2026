@echo off
REM ============================================================================
REM SCRIPT DE DÉMARRAGE SILENCIEUX J.A.R.V.I.S.
REM Rôle : Lance le Backend et le Frontend en ARRIÈRE-PLAN
REM        puis ouvre l'interface dans Google Chrome.
REM ============================================================================

setlocal
set PROJECT_ROOT=%~dp0
set SERVER_DIR=%PROJECT_ROOT%server
set CHROME_EXE="C:\Users\faber\AppData\Local\Google\Chrome\Application\chrome.exe"

echo.
echo ============================================================
echo   INITIALISATION SILENCIEUSE DU SYSTÉME J.A.R.V.I.S.
echo ============================================================
echo.

REM --- ÉTAPE 1 : Lancement du Mainframe (Backend) en arrière-plan ---
echo [1/3] Activation du Mainframe (Backend port 3001)...
powershell -Command "Start-Process cmd -ArgumentList '/c node server.js' -WindowStyle Hidden -WorkingDirectory '%SERVER_DIR%'"

timeout /t 3 /nobreak >nul

REM --- ÉTAPE 2 : Lancement de l'Interface (Frontend) en arrière-plan ---
echo [2/3] Génération de l'Interface (Frontend port 3000)...
powershell -Command "Start-Process cmd -ArgumentList '/c npm run dev' -WindowStyle Hidden -WorkingDirectory '%PROJECT_ROOT%'"

echo [3/3] Synchronisation des flux de données...
timeout /t 5 /nobreak >nul

REM --- ÉTAPE 3 : Ouverture de Chrome ---
echo [FINAL] Accès via Google Chrome...
if exist %CHROME_EXE% (
    start "" %CHROME_EXE% "http://localhost:3000"
) else (
    start chrome "http://localhost:3000"
)

echo.
echo ============================================================
echo   SYSTÈME OPÉRATIONNEL EN ARRIÈRE-PLAN.
echo   Utilisez 'stop-jarvis.bat' pour arrêter les serveurs.
echo ============================================================
echo.

timeout /t 3 >nul
endlocal
exit
