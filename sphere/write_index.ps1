$p = 'A:\02-PROJECTS\Jarvis2026\sphere\index.html'
[System.IO.File]::WriteAllText($p, '', [System.Text.Encoding]::UTF8)
Write-Host "Fichier vide OK - $(Get-Item $p | Select-Object -ExpandProperty Length) octets"
