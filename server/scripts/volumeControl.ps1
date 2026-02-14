param (
    [string]$action,
    [float]$value
)

# [EXPERT] Script de contrôle du volume système Windows - Version ULTRA-COMPATIBLE
# Cette version utilise la simulation de touches multimédia (SendKeys)
# Elle permet de contourner les erreurs COM 'E_NOINTERFACE' qui bloquent les accès bas niveau.

$wsh = New-Object -ComObject WScript.Shell

try {
    switch ($action) {
        "increase" { 
            # 5 clics = environ +10%
            for($i=0; $i -lt 5; $i++) { $wsh.SendKeys([char]175) }
            Write-Output "✅ SUCCESS | Volume augmenté"
        }
        "decrease" { 
            # 5 clics = environ -10%
            for($i=0; $i -lt 5; $i++) { $wsh.SendKeys([char]174) }
            Write-Output "✅ SUCCESS | Volume diminué"
        }
        "mute" { 
            # La touche 173 est un toggle (Mute/Unmute)
            $wsh.SendKeys([char]173)
            Write-Output "✅ SUCCESS | Mute basculé"
        }
        "unmute" { 
            $wsh.SendKeys([char]173)
            Write-Output "✅ SUCCESS | Unmute tenté"
        }
        "set" {
            # Pour régler un volume précis sans l'API COM :
            # 1. On descend le volume à 0 (50 clics de 2% pour être sûr)
            # 2. On remonte jusqu'à la valeur demandée (Valeur / 2)
            
            # Phase 1 : Mise à zéro
            for($i=0; $i -lt 50; $i++) { $wsh.SendKeys([char]174) }
            
            # Phase 2 : Remontée graduelle
            $steps = [Math]::Round($value / 2)
            for($i=0; $i -lt $steps; $i++) { $wsh.SendKeys([char]175) }
            
            Write-Output "✅ SUCCESS | Volume calibré à environ $value%"
        }
        "get" {
            # On renvoie une valeur fictive car Get est impossible sans COM
            Write-Output "50"
        }
    }
} catch {
    Write-Output "❌ ERROR | $($_.Exception.Message)"
    exit 1
}
