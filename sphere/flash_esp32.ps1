# Script PowerShell pour flasher l'ESP32-S3 depuis Windsurf (sans ouvrir VSCode)
# Utilise PlatformIO CLI

Write-Host "=== FLASH ESP32-S3 DEPUIS WINDSURF ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier si PlatformIO est installé
Write-Host "1. Vérification de PlatformIO..." -ForegroundColor Yellow
$pioTest = python -m platformio --version 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ PlatformIO non trouvé" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation requise:" -ForegroundColor Yellow
    Write-Host "  pip install platformio" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "   ✅ PlatformIO installé: $pioTest" -ForegroundColor Green
Write-Host ""

# Build du firmware
Write-Host "2. Compilation du firmware ESP32-S3..." -ForegroundColor Yellow
python -m platformio run

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Erreur de compilation" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Compilation réussie" -ForegroundColor Green
Write-Host ""

# Upload vers ESP32
Write-Host "3. Upload vers ESP32-S3..." -ForegroundColor Yellow
Write-Host "   (Assurez-vous que l'ESP32 est branché en USB)" -ForegroundColor Gray
python -m platformio run --target upload

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Erreur d'upload" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifications:" -ForegroundColor Yellow
    Write-Host "  - L'ESP32 est-il branché en USB ?" -ForegroundColor White
    Write-Host "  - Le port COM est-il libre (fermez Arduino IDE, Serial Monitor, etc.) ?" -ForegroundColor White
    Write-Host "  - Essayez de maintenir le bouton BOOT pendant l'upload" -ForegroundColor White
    exit 1
}

Write-Host "   ✅ Upload réussi" -ForegroundColor Green
Write-Host ""

# Moniteur série (optionnel)
Write-Host "4. Voulez-vous ouvrir le moniteur série ? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "O" -or $response -eq "o") {
    Write-Host "   Ouverture du moniteur série (Ctrl+C pour quitter)..." -ForegroundColor Gray
    python -m platformio device monitor --baud 115200
}

Write-Host ""
Write-Host "✅ Flash terminé avec succès !" -ForegroundColor Green
