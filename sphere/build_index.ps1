$out  = 'A:\02-PROJECTS\Jarvis2026\sphere\index.html'
$tmp  = 'A:\02-PROJECTS\Jarvis2026\sphere\index.tmp'
$p1   = 'A:\02-PROJECTS\Jarvis2026\sphere\idx_p1.txt'
$p2   = 'A:\02-PROJECTS\Jarvis2026\sphere\idx_p2.txt'
$p3   = 'A:\02-PROJECTS\Jarvis2026\sphere\idx_p3.txt'

$content = [System.IO.File]::ReadAllText($p1, [System.Text.Encoding]::UTF8) +
           [System.IO.File]::ReadAllText($p2, [System.Text.Encoding]::UTF8) +
           [System.IO.File]::ReadAllText($p3, [System.Text.Encoding]::UTF8)

[System.IO.File]::WriteAllText($tmp, $content, [System.Text.Encoding]::UTF8)

if (Test-Path $out) { Remove-Item $out -Force }
Rename-Item -Path $tmp -NewName 'index.html' -Force

$sz = (Get-Item $out).Length
Write-Host "OK - $sz bytes written to $out"
