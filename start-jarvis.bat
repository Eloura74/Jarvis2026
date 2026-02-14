@echo off
REM ============================================================================
REM Script de démarrage automatique de J.A.R.V.I.S.
REM Lance le backend puis le frontend
REM ============================================================================

echo.
echo ========================================
echo   J.A.R.V.I.S. - Démarrage Système
echo ========================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Node.js n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

echo [1/3] Démarrage du backend (port 3001)...
cd /d "%~dp0server"

REM Vérifier si node_modules existe dans server
if not exist "node_modules" (
    echo [INFO] Installation des dépendances backend...
    call npm install
)

REM Démarrer le backend en arrière-plan
start "JARVIS Backend" cmd /k "node server.js"
timeout /t 3 /nobreak >nul

echo.
echo [2/3] Démarrage du frontend (port 5173)...
cd /d "%~dp0"

REM Vérifier si node_modules existe dans le projet principal
if not exist "node_modules" (
    echo [INFO] Installation des dépendances frontend...
    call npm install
)

REM Démarrer le frontend
start "JARVIS Frontend" cmd /k "npm run dev"

echo.
echo [3/3] Attente de l'initialisation...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   ✅ J.A.R.V.I.S. est démarré !
echo ========================================
echo.
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo   Ouvrez votre navigateur sur localhost:5173
echo.
pause
