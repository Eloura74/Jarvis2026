# ============================================================================
# Script PowerShell de démarrage automatique de J.A.R.V.I.S.
# Lance le backend puis le frontend
# ============================================================================

Write-Host ""
Write-Host "========================================"
Write-Host "  J.A.R.V.I.S. - Démarrage Système" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "[INFO] Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Node.js n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "Téléchargez Node.js sur: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Répertoire du script
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $projectRoot "server"

# ============================================================================
# ÉTAPE 1 : Démarrage du Backend
# ============================================================================
Write-Host "[1/3] Démarrage du backend (port 3001)..." -ForegroundColor Yellow
Set-Location $serverPath

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installation des dépendances backend..." -ForegroundColor Cyan
    npm install
}

# Démarrer le backend dans une nouvelle fenêtre
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; node server.js"
Start-Sleep -Seconds 3

# ============================================================================
# ÉTAPE 2 : Démarrage du Frontend
# ============================================================================
Write-Host ""
Write-Host "[2/3] Démarrage du frontend (port 5173)..." -ForegroundColor Yellow
Set-Location $projectRoot

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installation des dépendances frontend..." -ForegroundColor Cyan
    npm install
}

# Démarrer le frontend dans une nouvelle fenêtre
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; npm run dev"

# ============================================================================
# ÉTAPE 3 : Attente et Informations
# ============================================================================
Write-Host ""
Write-Host "[3/3] Attente de l'initialisation..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================"
Write-Host "  ✅ J.A.R.V.I.S. est démarré !" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Ouvrez votre navigateur sur localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Pour arrêter : Fermez les 2 fenêtres PowerShell" -ForegroundColor White
Write-Host ""

# Ouvrir automatiquement le navigateur (optionnel)
$openBrowser = Read-Host "Ouvrir le navigateur automatiquement ? (O/N)"
if ($openBrowser -eq "O" -or $openBrowser -eq "o") {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:5173"
}

Read-Host "Appuyez sur Entrée pour quitter ce script (les serveurs continueront de tourner)"
